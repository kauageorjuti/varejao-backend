require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json());

// --- ROTAS DE USUÁRIOS E PRODUTOS (IGUAIS ANTES) ---
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const { data: exists } = await supabase.from('users').select('*').eq('email', email).single();
    if (exists) return res.status(400).json({ message: 'Email já cadastrado!' });
    const { error } = await supabase.from('users').insert([{ name, email, password }]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Sucesso!' });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
    if (error || !data) return res.status(401).json({ message: 'Login inválido' });
    res.json({ message: 'Logado!', user: data });
});

app.get('/products', async (req, res) => {
    const { data } = await supabase.from('products').select('*');
    res.json(data);
});

// --- NOVAS ROTAS (PEDIDOS) ---

// 1. Cliente faz uma compra (Checkout)
app.post('/checkout', async (req, res) => {
    const { user_email, total_price, items } = req.body;
    const { error } = await supabase
        .from('orders')
        .insert([{ user_email, total_price, items }]);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Compra realizada com sucesso!' });
});

// 2. Admin vê todos os pedidos
app.get('/orders', async (req, res) => {
    // Ordena do mais recente para o mais antigo
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false }); 
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 3. Admin envia o pedido (Muda status)
app.put('/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('orders')
        .update({ status: 'Enviado 🚚' })
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Pedido marcado como enviado!' });
});

app.listen(port, () => {
    console.log(`Servidor Varejão rodando na porta ${port}`);
});