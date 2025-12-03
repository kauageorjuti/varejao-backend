require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json());

console.log('📧 Configuração de Email:', {
    user: process.env.EMAIL_USER ? '✅ Configurado' : '❌ Faltando',
    pass: process.env.EMAIL_PASSWORD ? '✅ Configurado' : '❌ Faltando',
    admin: process.env.ADMIN_EMAIL ? '✅ Configurado' : '❌ Faltando',
    site: process.env.SITE_URL ? '✅ Configurado' : '❌ Faltando'
});


// ========== CONFIGURAÇÃO DO NODEMAILER ==========

// Criar transportador de email
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});


// Função auxiliar para enviar emails
async function enviarEmail(destinatario, assunto, htmlContent) {
    try {
        const info = await transporter.sendMail({
            from: `"Varejão Online 🍎" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: assunto,
            html: htmlContent
        });
        console.log('Email enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return { success: false, error: error.message };
    }
}

// ========== TEMPLATES DE EMAIL ==========

function templateBoasVindas(nome) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); padding: 40px 20px; text-align: center; color: white; }
                .header h1 { margin: 0; font-size: 32px; }
                .content { padding: 40px 30px; }
                .content h2 { color: #2c3e50; margin-bottom: 20px; }
                .content p { color: #34495e; line-height: 1.6; font-size: 16px; }
                .button { display: inline-block; background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .footer { background: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }
                .emoji { font-size: 48px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍎 Varejão Online</h1>
                </div>
                <div class="content">
                    <div class="emoji">🎉</div>
                    <h2>Bem-vindo(a), ${nome}!</h2>
                    <p>Estamos muito felizes em ter você conosco!</p>
                    <p>Sua conta foi criada com sucesso. Agora você pode aproveitar todas as vantagens de comprar frutas e verduras fresquinhas no conforto da sua casa.</p>
                    <p><strong>O que você pode fazer agora:</strong></p>
                    <ul>
                        <li>🛍️ Navegar pelo nosso catálogo de produtos</li>
                        <li>🛒 Adicionar itens ao carrinho</li>
                        <li>📦 Acompanhar seus pedidos</li>
                        <li>⭐ Salvar seus produtos favoritos</li>
                    </ul>
                    <a href="${process.env.SITE_URL || 'https://seu-site.vercel.app'}" class="button">Começar a Comprar</a>
                </div>
                <div class="footer">
                    <p>Varejão Online - Frutas e Verduras Frescas 🥕</p>
                    <p>Este é um email automático, por favor não responda.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function templateConfirmacaoPedido(nome, pedido) {
    const itensHTML = pedido.items.map(item => 
        `<li>${item.nome} - R$ ${parseFloat(item.preco).toFixed(2)}</li>`
    ).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 40px 20px; text-align: center; color: white; }
                .header h1 { margin: 0; font-size: 32px; }
                .content { padding: 40px 30px; }
                .content h2 { color: #2c3e50; margin-bottom: 20px; }
                .content p { color: #34495e; line-height: 1.6; font-size: 16px; }
                .order-box { background: #ecf0f1; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .order-box h3 { color: #2c3e50; margin-top: 0; }
                .order-box ul { list-style: none; padding: 0; }
                .order-box li { padding: 8px 0; border-bottom: 1px solid #bdc3c7; }
                .total { font-size: 24px; font-weight: bold; color: #e67e22; margin-top: 15px; }
                .footer { background: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }
                .emoji { font-size: 48px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛒 Pedido Confirmado!</h1>
                </div>
                <div class="content">
                    <div class="emoji">✅</div>
                    <h2>Obrigado, ${nome}!</h2>
                    <p>Seu pedido foi recebido com sucesso e já está sendo preparado.</p>
                    
                    <div class="order-box">
                        <h3>📋 Detalhes do Pedido</h3>
                        <ul>
                            ${itensHTML}
                        </ul>
                        <div class="total">Total: R$ ${parseFloat(pedido.total_price).toFixed(2)}</div>
                    </div>
                    
                    <p><strong>Status:</strong> ${pedido.status}</p>
                    <p>Você receberá outro email quando seu pedido for despachado para entrega.</p>
                    <p>Tempo estimado de entrega: <strong>24 horas</strong></p>
                </div>
                <div class="footer">
                    <p>Varejão Online - Frutas e Verduras Frescas 🥕</p>
                    <p>Este é um email automático, por favor não responda.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function templatePedidoEnviado(nome, pedido) {
    const itensHTML = pedido.items.map(item => 
        `<li>${item.nome}</li>`
    ).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); padding: 40px 20px; text-align: center; color: white; }
                .header h1 { margin: 0; font-size: 32px; }
                .content { padding: 40px 30px; }
                .content h2 { color: #2c3e50; margin-bottom: 20px; }
                .content p { color: #34495e; line-height: 1.6; font-size: 16px; }
                .tracking-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
                .tracking-box h3 { color: #155724; margin: 0 0 10px 0; }
                .status { font-size: 20px; font-weight: bold; color: #28a745; }
                .footer { background: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }
                .emoji { font-size: 48px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚚 Pedido a Caminho!</h1>
                </div>
                <div class="content">
                    <div class="emoji">📦</div>
                    <h2>Boa notícia, ${nome}!</h2>
                    <p>Seu pedido foi despachado e está a caminho!</p>
                    
                    <div class="tracking-box">
                        <h3>Status do Pedido</h3>
                        <div class="status">✅ ${pedido.status}</div>
                    </div>
                    
                    <p><strong>Itens enviados:</strong></p>
                    <ul>
                        ${itensHTML}
                    </ul>
                    
                    <p>Seu pedido deve chegar em breve. Fique atento!</p>
                    <p>Obrigado por escolher o Varejão Online! 🍎</p>
                </div>
                <div class="footer">
                    <p>Varejão Online - Frutas e Verduras Frescas 🥕</p>
                    <p>Este é um email automático, por favor não responda.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function templateNovoPedidoAdmin(pedido) {
    const itensHTML = pedido.items.map(item => 
        `<li>${item.nome} - R$ ${parseFloat(item.preco).toFixed(2)}</li>`
    ).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); padding: 40px 20px; text-align: center; color: white; }
                .header h1 { margin: 0; font-size: 32px; }
                .content { padding: 40px 30px; }
                .content h2 { color: #2c3e50; margin-bottom: 20px; }
                .order-box { background: #fff3cd; border: 2px solid #f39c12; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .order-box h3 { color: #856404; margin-top: 0; }
                .order-box ul { list-style: none; padding: 0; }
                .order-box li { padding: 8px 0; border-bottom: 1px solid #ffc107; }
                .total { font-size: 24px; font-weight: bold; color: #e67e22; margin-top: 15px; }
                .button { display: inline-block; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .footer { background: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Novo Pedido Recebido!</h1>
                </div>
                <div class="content">
                    <h2>Atenção, Administrador!</h2>
                    <p>Um novo pedido foi realizado e precisa ser processado.</p>
                    
                    <div class="order-box">
                        <h3>📋 Detalhes do Pedido</h3>
                        <p><strong>Cliente:</strong> ${pedido.user_email}</p>
                        <p><strong>Data:</strong> ${new Date(pedido.created_at).toLocaleString('pt-BR')}</p>
                        <ul>
                            ${itensHTML}
                        </ul>
                        <div class="total">Total: R$ ${parseFloat(pedido.total_price).toFixed(2)}</div>
                    </div>
                    
                    <a href="${process.env.SITE_URL || 'https://seu-site.vercel.app'}" class="button">Acessar Painel Admin</a>
                </div>
                <div class="footer">
                    <p>Varejão Online - Painel Administrativo</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ========== ROTAS DE USUÁRIOS ==========

app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const { data: exists } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (exists) {
            return res.status(400).json({ message: 'Email já cadastrado!' });
        }
        
        const { error } = await supabase
            .from('users')
            .insert([{ name, email, password }]);
        
        if (error) throw error;
        
        // 📧 ENVIAR EMAIL DE BOAS-VINDAS
        await enviarEmail(
            email,
            '🎉 Bem-vindo ao Varejão Online!',
            templateBoasVindas(name)
        );
        
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();
        
        if (error || !data) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos' });
        }
        
        res.json({ 
            message: 'Login realizado com sucesso!', 
            user: { 
                id: data.id, 
                name: data.name, 
                email: data.email 
            } 
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS DE PRODUTOS ==========

app.get('/products', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({ message: 'Produto não encontrado' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/products', async (req, res) => {
    try {
        const { name, price, quantity, image_url } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ message: 'Nome e preço são obrigatórios' });
        }
        
        const { data, error } = await supabase
            .from('products')
            .insert([{ 
                name, 
                price, 
                quantity: quantity || 0, 
                image_url: image_url || null 
            }])
            .select();
        
        if (error) throw error;
        
        res.status(201).json({ 
            message: 'Produto criado com sucesso!', 
            product: data[0] 
        });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, quantity, image_url } = req.body;
        
        const { data, error } = await supabase
            .from('products')
            .update({ name, price, quantity, image_url })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado' });
        }
        
        res.json({ 
            message: 'Produto atualizado com sucesso!', 
            product: data[0] 
        });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        res.json({ message: 'Produto excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTAS DE PEDIDOS ==========

app.post('/checkout', async (req, res) => {
    try {
        const { user_email, total_price, items } = req.body;
        
        if (!user_email || !total_price || !items || items.length === 0) {
            return res.status(400).json({ message: 'Dados incompletos para checkout' });
        }
        
        const { data, error } = await supabase
            .from('orders')
            .insert([{ 
                user_email, 
                total_price, 
                items,
                status: 'Pendente'
            }])
            .select();
        
        if (error) throw error;
        
        const pedido = data[0];
        
        // Buscar nome do usuário
        const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('email', user_email)
            .single();
        
        const nomeUsuario = userData ? userData.name : 'Cliente';
        
        // 📧 ENVIAR EMAIL DE CONFIRMAÇÃO PARA O CLIENTE
        await enviarEmail(
            user_email,
            '✅ Pedido Confirmado - Varejão Online',
            templateConfirmacaoPedido(nomeUsuario, pedido)
        );
        
        // 📧 ENVIAR EMAIL DE NOTIFICAÇÃO PARA O ADMIN
        if (process.env.ADMIN_EMAIL) {
            await enviarEmail(
                process.env.ADMIN_EMAIL,
                '🔔 Novo Pedido Recebido - Varejão Online',
                templateNovoPedidoAdmin(pedido)
            );
        }
        
        res.status(201).json({ 
            message: 'Compra realizada com sucesso!', 
            order: pedido 
        });
    } catch (error) {
        console.error('Erro no checkout:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/orders', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/orders/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_email', email)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar pedidos do usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const newStatus = status || 'Enviado 🚚';
        
        const { data, error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado' });
        }
        
        const pedido = data[0];
        
        // Buscar nome do usuário
        const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('email', pedido.user_email)
            .single();
        
        const nomeUsuario = userData ? userData.name : 'Cliente';
        
        // 📧 ENVIAR EMAIL DE PEDIDO ENVIADO PARA O CLIENTE
        await enviarEmail(
            pedido.user_email,
            '🚚 Seu Pedido Foi Despachado - Varejão Online',
            templatePedidoEnviado(nomeUsuario, pedido)
        );
        
        res.json({ 
            message: 'Status do pedido atualizado!', 
            order: pedido 
        });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTA DE TESTE ==========
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Varejão Online com Email está funcionando!',
        version: '2.1',
        features: ['Email notifications enabled'],
        endpoints: {
            users: ['/register', '/login'],
            products: ['/products', '/products/:id'],
            orders: ['/checkout', '/orders', '/orders/:id']
        }
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor Varejão Online rodando na porta ${port}`);
    console.log(`📡 Conectado ao Supabase`);
    console.log(`📧 Sistema de email configurado`);
});
