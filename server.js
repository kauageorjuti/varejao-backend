require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch'); // A solução para o erro de Timeout

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json());

// ========== FUNÇÃO DE EMAIL VIA API (SEM BLOQUEIO) ==========

async function enviarEmail(destinatario, assunto, htmlContent) {
    const url = 'https://api.brevo.com/v3/smtp/email';
    const options = {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY, // Pega a chave nova do Render
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'Varejão Online', email: process.env.ADMIN_EMAIL }, // O email DEVE ser validado no Brevo
            to: [{ email: destinatario }],
            subject: assunto,
            htmlContent: htmlContent
        })
    };

    try {
        const response = await fetch(url, options);
        if (response.ok) {
            console.log(`✅ Email enviado com sucesso para ${destinatario}`);
            return { success: true };
        } else {
            const erro = await response.json();
            console.error('❌ Erro API Brevo:', erro);
            return { success: false, error: erro };
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        return { success: false, error: error.message };
    }
}

// ========== TEMPLATES DE EMAIL (Mantidos originais) ==========

function templateBoasVindas(nome) {
    return `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
            <div style="background: #2ecc71; padding: 20px; text-align: center; color: white;">
                <h1>🍎 Bem-vindo ao Varejão!</h1>
            </div>
            <div style="padding: 20px;">
                <h2>Olá, ${nome}!</h2>
                <p>Sua conta foi criada com sucesso. Aproveite nossas frutas fresquinhas.</p>
                <a href="${process.env.SITE_URL}" style="display: inline-block; background: #2ecc71; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir para o Site</a>
            </div>
        </div>
    `;
}

function templateConfirmacaoPedido(nome, pedido) {
    const itens = pedido.items.map(i => `<li>${i.nome} - R$ ${i.preco}</li>`).join('');
    return `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
            <div style="background: #3498db; padding: 20px; text-align: center; color: white;">
                <h1>🛒 Pedido Confirmado!</h1>
            </div>
            <div style="padding: 20px;">
                <h2>Obrigado, ${nome}!</h2>
                <p>Recebemos seu pedido de <strong>R$ ${parseFloat(pedido.total_price).toFixed(2)}</strong>.</p>
                <ul>${itens}</ul>
                <p>Em breve enviaremos o código de rastreio.</p>
            </div>
        </div>
    `;
}

function templateNovoPedidoAdmin(pedido) {
    return `
        <div style="font-family: Arial; background: #fff3cd; padding: 20px; border: 1px solid #ffeeba;">
            <h2 style="color: #856404;">💰 Nova Venda!</h2>
            <p><strong>Cliente:</strong> ${pedido.user_email}</p>
            <p><strong>Valor:</strong> R$ ${parseFloat(pedido.total_price).toFixed(2)}</p>
            <p>Corre lá no painel para despachar!</p>
        </div>
    `;
}

function templatePedidoEnviado(nome, pedido) {
    return `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
            <div style="background: #e67e22; padding: 20px; text-align: center; color: white;">
                <h1>🚚 Pedido Enviado!</h1>
            </div>
            <div style="padding: 20px;">
                <h2>Boas notícias, ${nome}!</h2>
                <p>Seus produtos já saíram para entrega.</p>
                <div style="background: #f8f9fa; padding: 15px; border-left: 5px solid #28a745; margin: 20px 0;">
                    Status: <strong>Saiu para Entrega</strong>
                </div>
            </div>
        </div>
    `;
}

// ========== ROTAS (IGUAIS, MAS USANDO A NOVA FUNÇÃO) ==========

app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const { data: exists } = await supabase.from('users').select('*').eq('email', email).single();
        if (exists) return res.status(400).json({ message: 'Email já cadastrado!' });
        
        const { error } = await supabase.from('users').insert([{ name, email, password }]);
        if (error) throw error;
        
        // Envia email sem esperar (para ser rápido)
        enviarEmail(email, 'Bem-vindo ao Varejão!', templateBoasVindas(name));
        
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
    if (error || !data) return res.status(401).json({ message: 'Login inválido' });
    res.json({ message: 'Logado!', user: data });
});

app.get('/products', async (req, res) => {
    const { data } = await supabase.from('products').select('*').order('name');
    res.json(data);
});

app.post('/checkout', async (req, res) => {
    try {
        const { user_email, total_price, items } = req.body;
        
        // Salva o pedido
        const { data, error } = await supabase
            .from('orders')
            .insert([{ user_email, total_price, items, status: 'Pendente' }])
            .select();
            
        if (error) throw error;
        const pedido = data[0];

        // Tenta achar o nome do usuário
        const { data: user } = await supabase.from('users').select('name').eq('email', user_email).single();
        const nome = user ? user.name : 'Cliente';

        // Envia emails
        enviarEmail(user_email, 'Pedido Confirmado ✅', templateConfirmacaoPedido(nome, pedido));
        
        if (process.env.ADMIN_EMAIL) {
            enviarEmail(process.env.ADMIN_EMAIL, '🔔 Nova Venda!', templateNovoPedidoAdmin(pedido));
        }

        res.status(201).json({ message: 'Compra realizada!', order: pedido });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/orders', async (req, res) => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    res.json(data);
});

app.put('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Atualiza status
        const { data, error } = await supabase
            .from('orders')
            .update({ status: 'Enviado 🚚' })
            .eq('id', id)
            .select();
            
        if (error) throw error;
        const pedido = data[0];

        // Busca nome para o email
        const { data: user } = await supabase.from('users').select('name').eq('email', pedido.user_email).single();
        const nome = user ? user.name : 'Cliente';

        // Avisa que enviou
        enviarEmail(pedido.user_email, 'Pedido a Caminho 🚚', templatePedidoEnviado(nome, pedido));

        res.json({ message: 'Pedido enviado!', order: pedido });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('API Varejão Online (Via Brevo API) está funcionando! 🚀');
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});