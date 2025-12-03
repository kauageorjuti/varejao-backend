
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json());

// ========== ROTAS DE USUÁRIOS ==========

// Registro de novo usuário
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Verifica se o email já existe
        const { data: exists } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (exists) {
            return res.status(400).json({ message: 'Email já cadastrado!' });
        }
        
        // Insere novo usuário
        const { error } = await supabase
            .from('users')
            .insert([{ name, email, password }]);
        
        if (error) throw error;
        
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login de usuário
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

// Listar todos os produtos
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

// Buscar produto por ID
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

// Criar novo produto
app.post('/products', async (req, res) => {
    try {
        const { name, price, quantity, image_url } = req.body;
        
        // Validação básica
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

// Atualizar produto
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

// Deletar produto
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

// Cliente faz uma compra (Checkout)
app.post('/checkout', async (req, res) => {
    try {
        const { user_email, total_price, items } = req.body;
        
        // Validação básica
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
        
        res.status(201).json({ 
            message: 'Compra realizada com sucesso!', 
            order: data[0] 
        });
    } catch (error) {
        console.error('Erro no checkout:', error);
        res.status(500).json({ error: error.message });
    }
});

// Listar todos os pedidos (Admin)
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

// Buscar pedidos de um usuário específico
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

// Admin atualiza status do pedido
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
        
        res.json({ 
            message: 'Status do pedido atualizado!', 
            order: data[0] 
        });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ROTA DE TESTE ==========
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Varejão Online está funcionando!',
        version: '2.0',
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
});