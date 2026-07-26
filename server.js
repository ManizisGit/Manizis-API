const express = require("express");

const app = express();

app.use(express.json());


// Token de segurança
const API_TOKEN = process.env.API_TOKEN;


// Verificação da API (pública)
app.get("/", (req, res) => {
    res.json({
        status: "online",
        mensagem: "API Manizis funcionando!"
    });
});


// Proteção das rotas API
app.use("/api", (req, res, next) => {

    const token = req.headers.authorization;

    if (token !== `Bearer ${API_TOKEN}`) {
        return res.status(401).json({
            erro: "Não autorizado"
        });
    }

    next();

});


// Teste da API
app.post("/api/teste", (req, res) => {

    console.log("Recebi:");
    console.log(req.body);

    res.json({
        status: "ok",
        mensagem: "Olá AppSheet!"
    });

});


// Clientes
app.post("/api/clientes", (req, res) => {

    const cliente = req.body;

    console.log("Novo cliente:");
    console.log(cliente);

    res.json({
        sucesso: true,
        clienteRecebido: cliente
    });

});


// Receber Caixa via AppSheet
app.post("/api/caixa", (req, res) => {

    const caixa = req.body;

    console.log("Novo lançamento Caixa:");
    console.log(caixa);

    res.json({
        sucesso: true,
        mensagem: "Caixa recebido pela API Manizis",
        dados: caixa
    });

});


// Leads Imobibrasil
app.post("/api/leads/imobibrasil", (req, res) => {

    console.log("========== NOVO LEAD ==========");
    console.log(req.headers);
    console.log(req.body);

    res.json({
        sucesso: true
    });

});


// ===========================
// // LEADS - RECEBER DO APPSHEET
// ===========================
app.post("/api/leads", (req, res) => {

    console.log("========== NOVO LEAD ==========");
    console.log("Data/Hora:", new Date().toLocaleString("pt-BR"));

    console.log("Headers:");
    console.log(req.headers);

    console.log("Body:");
    console.log(req.body);

    res.json({
        sucesso: true,
        mensagem: "Lead recebido com sucesso!",
        lead: req.body
    });

});


// Porta para Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
