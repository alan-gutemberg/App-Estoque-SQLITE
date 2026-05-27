const express = require('express');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = 3000;

// Configuração do Banco de Dados SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './estoque.sqlite',
    logging: false
});

// Modelo da Tabela
const Produto = sequelize.define('Produto', {
    nome: { type: DataTypes.STRING, allowNull: false },
    tamanho: { type: DataTypes.STRING, allowNull: false },
    cor: { type: DataTypes.STRING, allowNull: false },
    modelo: { type: DataTypes.STRING, allowNull: false },
    referencia: { type: DataTypes.STRING, allowNull: false, unique: true }
});

sequelize.sync()
    .then(() => console.log('📦 Banco de dados SQLite pronto para uso.'))
    .catch(err => console.error('❌ Erro no banco:', err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas das Páginas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/estoque', (req, res) => res.sendFile(path.join(__dirname, 'public', 'estoque.html')));
app.get('/cadastrar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cadastrar.html')));
app.get('/editar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'editar.html')));

// ==========================================
// LOGICA CORRIGIDA DA API
// ==========================================

// Rota de Cadastro (com .trim() para remover espaços acidentais)
app.post('/api/produtos', async (req, res) => {
    try {
        const nome = req.body.nome.trim();
        const tamanho = req.body.tamanho.trim();
        const cor = req.body.cor.trim();
        const modelo = req.body.modelo.trim();
        const referencia = req.body.referencia.trim();
        
        await Produto.create({ nome, tamanho, cor, modelo, referencia });
        console.log(`✅ NOVO CADASTRO: Ref [${referencia}] salva com sucesso.`);
        res.redirect('/estoque');
    } catch (error) {
        console.error('❌ ERRO AO CADASTRAR:', error.message);
        res.status(500).send('Erro ao salvar. Verifique se essa referência já existe.');
    }
});

// Rota de Busca por Referência (com Logs de diagnóstico para o terminal)
app.get('/api/produtos/:referencia', async (req, res) => {
    try {
        const refBuscada = req.params.referencia.trim();
        console.log(`\n🔍 Buscando no banco pela referência: "${refBuscada}"`);
        
        const produto = await Produto.findOne({ where: { referencia: refBuscada } });
        
        if (produto) {
            console.log(`   ➔ 🎉 Produto encontrado: ${produto.nome}`);
            res.json(produto);
        } else {
            console.log(`   ➔ ⚠️ Nenhhum produto possui a referência: "${refBuscada}"`);
            res.status(404).json({ error: 'Produto não encontrado' });
        }
    } catch (error) {
        console.error('❌ ERRO NA BUSCA:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// Rota para Salvar a Edição
app.post('/api/produtos/editar', async (req, res) => {
    try {
        const { nome, tamanho, cor, modelo, referencia } = req.body;
        await Produto.update(
            { nome: nome.trim(), tamanho: tamanho.trim(), cor: cor.trim(), modelo: modelo.trim() },
            { where: { referencia: referencia.trim() } }
        );
        console.log(`🔄 ALTERAÇÃO: Ref [${referencia}] atualizada no banco.`);
        res.redirect('/estoque');
    } catch (error) {
        console.error('❌ ERRO AO EDITAR:', error);
        res.status(500).send('Erro ao salvar edições.');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Sistema atualizado rodando em http://localhost:${PORT}`);
});