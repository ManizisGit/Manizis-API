const express = require("express");

const app = express();

app.use(express.json());


// Verificação da API
app.get("/", (req, res) => {
    res.json({
        status: "online",
        mensagem: "API Manizis funcionando!"
    });
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



// Porta para Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
