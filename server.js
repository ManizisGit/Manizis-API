const express = require("express");

const app = express();

app.use(express.json());

// Token de segurança
const API_TOKEN = process.env.API_TOKEN;

// =====================================================
// VERIFICAÇÃO DA API
// =====================================================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        mensagem: "API Manizis funcionando!"
    });
});

// =====================================================
// PROTEÇÃO DAS ROTAS API
// =====================================================

app.use("/api", (req, res, next) => {

    const token = req.headers.authorization;

    if (token !== `Bearer ${API_TOKEN}`) {
        return res.status(401).json({
            erro: "Não autorizado"
        });
    }

    next();
});

// =====================================================
// TESTE DA API
// =====================================================

app.post("/api/teste", (req, res) => {

    console.log("Recebi:");
    console.log(req.body);

    res.json({
        status: "ok",
        mensagem: "Olá AppSheet!"
    });
});

// =====================================================
// CLIENTES
// =====================================================

app.post("/api/clientes", (req, res) => {

    const cliente = req.body;

    console.log("Novo cliente:");
    console.log(cliente);

    res.json({
        sucesso: true,
        clienteRecebido: cliente
    });
});

// =====================================================
// CAIXA
// =====================================================

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


// =====================================================
// LIMPAR MENSAGEM HTML
// =====================================================

function limparMensagem(texto) {

    if (!texto) return "";

    return String(texto)

        // <br>, <br/>, <br />
        .replace(/<br\s*\/?>/gi, "\n")

        // Remove outras tags HTML
        .replace(/<[^>]*>/g, "")

        // Entidades HTML
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")

        .replace(/&aacute;/gi, "á")
        .replace(/&agrave;/gi, "à")
        .replace(/&atilde;/gi, "ã")
        .replace(/&acirc;/gi, "â")

        .replace(/&eacute;/gi, "é")
        .replace(/&egrave;/gi, "è")
        .replace(/&ecirc;/gi, "ê")
        .replace(/&iacute;/gi, "í")

        .replace(/&oacute;/gi, "ó")
        .replace(/&ograve;/gi, "ò")
        .replace(/&ocirc;/gi, "ô")
        .replace(/&otilde;/gi, "õ")

        .replace(/&uacute;/gi, "ú")
        .replace(/&ccedil;/gi, "ç")

        // Espaços duplicados
        .replace(/[ \t]+/g, " ")

        // Espaços depois da quebra
        .replace(/\n[ \t]+/g, "\n")

        .trim();
}


// =====================================================
// NORMALIZAR TELEFONE
// =====================================================

function normalizarTelefone(telefone) {

    if (!telefone) return "";

    return String(telefone).replace(/\D/g, "");
}


// =====================================================
// NORMALIZAR EMAIL
// =====================================================

function normalizarEmail(email) {

    if (!email) return "";

    return String(email)
        .trim()
        .toLowerCase();
}


// =====================================================
// GERAR CHAVE DO LEAD
// =====================================================

function gerarChaveLead(lead) {

    const telefone = normalizarTelefone(lead.Telefone1);

    const email = normalizarEmail(lead.Email);

    const imovel = String(lead.ImovelSite || "")
        .trim();

    // -------------------------------------------------
    // LEAD DE IMÓVEL
    // -------------------------------------------------

    if (imovel) {

        return `${telefone}|${imovel}`;

    }

    // -------------------------------------------------
    // LEAD SEM IMÓVEL
    // -------------------------------------------------

    return `${telefone}|${email}`;

}


// =====================================================
// LEADS IMOBIBRASIL
// =====================================================

app.post("/api/leads/imobibrasil", async (req, res) => {

    try {

        console.log("");
        console.log("==========================================");
        console.log("========== NOVO LEAD RECEBIDO ===========");
        console.log("==========================================");

        console.log(req.body);

        const lead = req.body;


        // =================================================
        // GERAR CHAVE
        // =================================================

        const chaveLead = gerarChaveLead(lead);

        console.log("");
        console.log("ChaveLead gerada:");
        console.log(chaveLead);


        // =================================================
        // CONSULTAR SE JÁ EXISTE
        // =================================================

        console.log("");
        console.log("Consultando duplicidade no AppSheet...");


        const respostaBusca = await fetch(
            "https://api.appsheet.com/api/v2/apps/d286d41e-2dff-4a2e-9138-cf62f49539ae/tables/Lista_Leads/Action",
            {
                method: "POST",

                headers: {
                    "ApplicationAccessKey": process.env.APPSHEET_KEY,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    Action: "Find",

                    Properties: {
                        Locale: "pt-BR",

                        Selector: `FILTER("Lista_Leads", [ChaveLead] = "${chaveLead}")`

                    },

                    Rows: []

                })
            }
        );


        const textoBusca = await respostaBusca.text();

        let resultadoBusca;

        try {

            resultadoBusca = JSON.parse(textoBusca);

        } catch {

            resultadoBusca = textoBusca;

        }


        console.log("");
console.log("Resultado da busca:");
console.log(resultadoBusca);

// =================================================
// VERIFICAR SE ENCONTROU
// =================================================

const linhasEncontradas =
    resultadoBusca &&
    Array.isArray(resultadoBusca.Rows)
        ? resultadoBusca.Rows
        : [];

const leadDuplicado = linhasEncontradas.some(
    linha =>
        String(linha.ChaveLead || "").trim() ===
        String(chaveLead || "").trim()
);

if (respostaBusca.ok && leadDuplicado) {

    console.log("");
    console.log("==========================================");
    console.log("⚠️ LEAD DUPLICADO - NÃO SERÁ CRIADO");
    console.log("==========================================");
    console.log("Chave:", chaveLead);

    return res.json({

        sucesso: true,

        duplicado: true,

        mensagem: "Lead duplicado. Registro não criado.",

        chaveLead: chaveLead

    });
}


        // =================================================
        // SE NÃO ENCONTROU → CRIAR
        // =================================================

        console.log("");
        console.log("==========================================");
        console.log("✅ LEAD NOVO - CRIANDO NO APPSHEET");
        console.log("==========================================");


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

                            Nome: lead.Nome || "",

                            Email: lead.Email || "",

                            Telefone1: lead.Telefone1 || "",

                            RG: lead.RG || "",

                            CPF: lead.CPF || "",

                            CNPJ: lead.CNPJ || "",

                            // Mensagem já limpa
                            Mensagem: limparMensagem(lead.Mensagem),

                            Origem: lead.Origem || "",

                            Canal: lead.Canal || "",

                            Finalidade: lead.Finalidade || "",

                            ImovelSite: lead.ImovelSite || "",

                            LinkSite: lead.ImovelSite
                                ? `https://valdir-imoveis.com/imovel/${lead.ImovelSite}`
                                : "",

                            EnderecoImovel: [

                                lead.Logradouro,
                                lead.Numero,
                                lead.Complemento,
                                lead.Bairro,
                                lead.Cidade

                            ]

                                .filter(
                                    valor =>
                                        valor &&
                                        String(valor).trim() !== ""
                                )

                                .join(", ")

                                + (
                                    lead.UF
                                        ? " - " + lead.UF
                                        : ""
                                ),

                            ValorImovel: lead.ValorImovel || "",

                            Status: "Novo",

                            Responsavel: "",

                            // Chave utilizada para evitar duplicidade
                            ChaveLead: chaveLead

                        }
                    ]

                })
            }
        );


        // =================================================
        // RESPOSTA DO APPSHEET
        // =================================================

        const textoRetorno = await resposta.text();

        let retorno;

        try {

            retorno = JSON.parse(textoRetorno);

        } catch {

            retorno = textoRetorno;

        }


        console.log("");
        console.log("Resposta AppSheet:");
        console.log(retorno);


        // =================================================
        // RESPOSTA PARA IMOBIBRASIL
        // =================================================

        res.json({

            sucesso: resposta.ok,

            duplicado: false,

            chaveLead: chaveLead,

            appsheet: retorno

        });


    } catch (erro) {

        console.log("");
        console.log("==========================================");
        console.log("❌ ERRO NA API");
        console.log("==========================================");

        console.log(erro);


        res.status(500).json({

            sucesso: false,

            erro: erro.message

        });

    }

});


// =====================================================
// PORTA PARA RENDER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Servidor iniciado na porta ${PORT}`);

});
