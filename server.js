require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000; // Importante para o Render!

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json());

// Rota de Teste (para saber se está vivo)
app.get('/', (req, res) => {
    res.send('API do Varejão está funcionando!');
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
    if (error || !data) return res.status(401).json({ message: 'Erro no login' });
    res.json({ message: 'Logado!', user: data });
});
// ... (seu código anterior)

// ROTA DE CADASTRO DE USUÁRIO (Novo!)
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Verifica se já existe
    const { data: userExists } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (userExists) {
        return res.status(400).json({ message: 'Este e-mail já está cadastrado!' });
    }

    // Cria o usuário
    const { data, error } = await supabase
        .from('users')
        .insert([{ name, email, password }])
        .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Usuário cadastrado com sucesso! Faça login.' });
});

// ... (resto do código)
// Listar Produtos
app.get('/products', async (req, res) => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Criar Produto
app.post('/products', async (req, res) => {
    const { name, price, quantity } = req.body;
    const { data, error } = await supabase.from('products').insert([{ name, price, quantity }]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Criado!' });
});

// Deletar Produto
app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Deletado!' });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});