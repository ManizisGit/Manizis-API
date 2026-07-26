const express = require("express");

const fetch = require("node-fetch");


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
app.post("/api/leads/imobibrasil", async (req, res) => {

    try {

        console.log("========== NOVO LEAD ==========");
        console.log(req.body);


        const lead = req.body;


        const resposta = await fetch(
            "https://api.appsheet.com/api/v2/apps/d286d41e-2dff-4a2e-9138-cf62f49539ae/tables/Lista_Leads/Action",
            {
                method: "POST",
                headers: {
                    "ApplicationAccessKey": process.env.APPSHEET_KEY,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    Action: "Add",

                    Properties: {
                        Locale: "pt-BR"
                    },

                    Rows: [
                        {
                            Ref: Date.now().toString(),

                            Nome: lead.Nome,
                            Email: lead.Email,
                            Telefone1: lead.Telefone,

                            Mensagem: lead.Mensagem,

                            Origem: "Imobibrasil",

                            Canal: lead.Canal,

                            Finalidade: lead.Finalidade,

                            ImovelSite: lead.ImovelSite,

                            ValorImovel: lead.ValorImovel,

                            Status: "Novo",

                            DataCadastro: new Date().toISOString()
                        }
                    ]

                })
            }
        );


        const retorno = await resposta.json();


        console.log("Resposta AppSheet:");
        console.log(retorno);


        res.json({
            sucesso: true,
            appsheet: retorno
        });


    } catch (erro) {

        console.log("ERRO:");
        console.log(erro);

        res.status(500).json({
            sucesso: false,
            erro: erro.message
        });

    }

});





// Porta para Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
