# Inventário Firestore — Express Imobi Tech / Express Auto Tech

Varredura estática de `src/**/*.{js,jsx}` (190 arquivos): **240 acessos**, **47 caminhos**. Nenhuma regra foi alterada.

`oficinas/{oficinaId}/x` = o segundo segmento é variável (`imobiliariaId`/`oficinaId`/`uid` do dono). **L** = leitura, **E** = escrita.

## Coleções e subcoleções

| Caminho | L | E | Principais arquivos | Campos conhecidos |
|---|---:|---:|---|---|
| `acompanhamentos_publicos` | 1 | 3 | src\components\acompanhamento\AcompanhamentoCliente.jsx, src\components\acompanhamento\AcompanharProcesso.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `desmanche_global` | 2 | 1 | src\components\desmanche\AbaBuscaRede.jsx, src\components\desmanche\Desmanche.jsx | desmanchemId, desmanchemNome, tipo, modelo, fotos[], data, lida |
| `equipe` | 1 | 0 | src\LoginAdmin.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `imoveis_imobi` | 2 | 0 | src\PortalCliente.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `leads` | 0 | 1 | src\PortalCliente.jsx | nome, telefone, imovel, problema, status, origem, orcamento, data_registro (global, criado pelo PortalCliente) |
| `oficinas` | 7 | 11 | src\AdminNovo.jsx, src\Cadastro.jsx, src\Configuracoes.jsx, src\LeadsPage.jsx | uid, nomeOficina, cidade, telefone, email, plano, isPro, tipoPlano, nivelInteligencia, trialInicio, trialFim, ativo, criadoEm, modulosAtivos, modulosOperacionais, planoOrigem, planoAtualizadoEm, creditosIA*, limiteUsuarios* (*backend) |
| `ordensServico` | 1 | 0 | src\components\admin\Precificacao.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `os` | 1 | 0 | src\Login.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `planos` | 1 | 0 | src\hooks\useCarregamentoInicial.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `tarefas` | 1 | 3 | src\pages\admin\Tarefas.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `usuarios` | 3 | 8 | src\Cadastro.jsx, src\Configuracoes.jsx, src\LoginAdmin.jsx, src\OfficeContext.jsx | uid, nome, email, telefone, oficinaId, papel, modulos, administrador_ia, dataCriacao |
| `vistorias` | 2 | 0 | src\PortalCliente.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `configuracoes_admin/master` | 2 | 1 | src\components\MasterPanel.jsx, src\hooks\useCarregamentoInicial.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/acompanhamentos_imobi` | 1 | 3 | src\components\acompanhamento\AcompanhamentoCliente.jsx | cliente, imovel, tipo, codigo, senha, etapas, concluidas, etapaLabel, status, tenantId, atualizadoEm |
| `oficinas/{oficinaId}/agendamentos_retorno` | 0 | 1 | src\pages\admin\RevisaoPremium.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/descartes` | 2 | 2 | src\components\Burocracias.jsx, src\components\MasterPanel.jsx | novoDescarte (spread), dataRegistro |
| `oficinas/{oficinaId}/desmanche_parceiros` | 2 | 2 | src\components\desmanche\AbaParceiros.jsx, src\components\desmanche\Desmanche.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/desmanche_pecas` | 2 | 4 | src\components\desmanche\AbaPecas.jsx, src\components\desmanche\Desmanche.jsx | tipo, descricao, valor, formaPagamento, data, data_registro |
| `oficinas/{oficinaId}/desmanche_veiculos` | 1 | 4 | src\components\desmanche\AbaVeiculos.jsx, src\components\desmanche\Desmanche.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/equipe` | 6 | 5 | src\AdminNovo.jsx, src\Equipe.jsx, src\PagamentosEquipe.jsx, src\components\Administrador.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/estoque` | 3 | 4 | src\Estoque.jsx, src\hooks\useCarregamentoInicial.jsx, src\hooks\useDados.js | nome, categoria, qtd, valor |
| `oficinas/{oficinaId}/fechamentos_diarios` | 1 | 1 | src\FechamentoCaixa.jsx, src\components\Administrador.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/financeiro` | 3 | 7 | src\FechamentoCaixa.jsx, src\Financeiro.jsx, src\OfficeContext.jsx, src\PagamentosEquipe.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/fornecedores` | 1 | 2 | src\components\Fornecedores.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/imoveis_imobi` | 3 | 2 | src\AdminNovo.jsx, src\components\imobi\RadarCaptacao.jsx, src\components\imobi\RadarVitrine.jsx | titulo, tipo, finalidade, padraoImovel, status, bairro, quartos, valor, fotos[], fotoCapa, codigo, publico, quadra, lote, metragemTerreno, hectares, aptidaoRural, benfeitorias, modalidadeGarantia, regrasLocacao |
| `oficinas/{oficinaId}/imoveis_nicho` | 1 | 2 | src\components\imobi\CaptacaoNicho.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/leads` | 4 | 8 | src\LeadsPage.jsx, src\PortalCliente.jsx, src\components\AtendimentoRapido.jsx, src\components\LeadButton.jsx | dadosClienteDoc (cliente), telefoneLimpo, placaNormalizada, status, data_cadastro, data_registro, totalVisitas |
| `oficinas/{oficinaId}/leads_imobi` | 2 | 8 | src\AdminNovo.jsx, src\LeadsPage.jsx, src\PortalCliente.jsx, src\hooks\useQuickActions.js | nome, telefone, interesse, bairro, orcamento, estagio, etapaAlteradaEm, corretorResponsavel, corretorWhatsapp, distribuidoPorRoleta, prazoAceiteMin, origem, criadoEm, data_registro, imovel, problema, status |
| `oficinas/{oficinaId}/notas_fiscais_imobi` | 1 | 1 | src\NotaFiscal.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/notificacoes_desmanche` | 0 | 1 | src\components\desmanche\Desmanche.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/os` | 10 | 29 | src\ArCondicionado.jsx, src\Eletrica.jsx, src\Escapamento.jsx, src\Estetica.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/patrimonio` | 1 | 2 | src\components\OficinaPatrimonio.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/propostas_imobi` | 2 | 3 | src\AdminNovo.jsx, src\Historico.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/relatorios_mensais` | 1 | 0 | src\DashboardTab.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/retornos` | 4 | 4 | src\DashboardTab.jsx, src\LeadsPage.jsx, src\components\GestaoRetorno.jsx, src\lib\retornos.js | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/revisoes_premium` | 2 | 6 | src\DashboardTab.jsx, src\components\TorreDeControle360.jsx, src\pages\admin\RevisaoPremium.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/tarefas` | 4 | 7 | src\AdminNovo.jsx, src\components\vistoria\VistoriaImobiliaria.jsx, src\hooks\useQuickActions.js, src\pages\admin\Tarefas.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/visitas_imobi` | 1 | 1 | src\AdminNovo.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/vistorias` | 1 | 2 | src\components\vistoria\VistoriaImobiliaria.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/MASTER/configuracoes/planos` | 1 | 1 | src\components\MasterPanel.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/MASTER/configuracoes/videos_ajuda` | 2 | 1 | src\components\MasterPanel.jsx, src\components\admin\Ajuda.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/burocracias/alvaras` | 2 | 1 | src\components\Burocracias.jsx, src\components\MasterPanel.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/burocracias/checklist` | 2 | 1 | src\components\Burocracias.jsx, src\components\MasterPanel.jsx | checklist (spread), dataAtualizacao |
| `oficinas/{oficinaId}/config/geral` | 1 | 0 | src\hooks\useCarregamentoInicial.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/configuracoes/geral` | 2 | 1 | src\Configuracoes.jsx, src\StatusOS.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/configuracoes/precificacao` | 1 | 1 | src\components\admin\Precificacao.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |
| `oficinas/{oficinaId}/equipe/auditorias` | 0 | 1 | src\components\GestaoEquipe.jsx | **NÃO MAPEADO** (escrita por spread de estado do formulário) |

## Coleções novas — Correspondente / Crédito (Fases 1 e 2)

| Caminho | L | E | Campos |
|---|---:|---:|---|
| `parametrosCredito/{versao}` (global) | 1 | 0 | versao, vigenciaInicio, vigenciaFim, validado, mcmv{...}, sbpe{...}, seguros{mipPct,dfiPct,tarifaMensal}, estimativaSubsidio, comissoes[] — **escrita manual/Admin SDK** |
| `oficinas/{oficinaId}/credito_simulacoes` | 0 | 1 | oficinaId, corretorId, criadoPor, criadoEm, leadId, leadNome, imovelId, rotulo, entrada{...}, saida{enquadramento,financiavel,entradaNecessaria,subsidio,parcelaInicial,parcelaFinal,comprometimento,taxaAnual,prazo,sistema,alertas}, parametrosVersao, parametrosValidados, resultadoOficial |
| `oficinas/{oficinaId}/credito_processos` | 0 | 2 | oficinaId, corretorId, criadoPor, criadoEm, leadId, leadNome, imovelId, imovelTitulo, valorImovel, proponentes[{nome,cpfMascarado,renda,estadoCivil,regimeBens,perfil}], banco, modalidade, valorFinanciado, etapa, etapaDesde, motivoReprovacao, sla{etapa,prazoEm}, simulacaoId, consentimentoLGPD{aceito,em,versao}, historico[{de,para,em,autor,autorId,motivo}], atualizadoEm |

**Queries do cliente:**
```js
query(collection(db,'oficinas',oficinaId,'credito_processos'))                          // dono/admin
query(..., where('corretorId','==',uid))                                                 // corretor
getDoc(doc(db,'parametrosCredito',versao))                                               // qualquer logado
```
`credito_simulacoes` só recebe `addDoc` (nenhuma leitura no cliente ainda).

## Quem mais escreve (fora do cliente)

### `functions/index.js` — Admin SDK, 2 exports
| Função | Tipo | Escreve | Lê |
|---|---|---|---|
| `ativarPlano` | onCall | `oficinas/{id}` merge: `plano`, `isPro`, `tipoPlano`, `modulosOperacionais`, `planoOrigem`, `planoAtualizadoEm`, `nivelInteligencia` | `usuarios/{uid}`; query `oficinas` por `email`; query `usuarios` por `email`; `oficinas/{id}/assinaturas/atual` |
| `pagamentoWebhook` | onRequest (`x-webhook-secret`) | `oficinas/{id}/assinaturas/atual` merge: `status`, `plano`, `ciclo`, `valor`, `gateway`, `pagamentoId`, `atualizadoEm` → chama `aplicarPlano` | `oficinas` por `email` |

Também `admin.auth().setCustomUserClaims` (não é Firestore).

### n8n — **NÃO IDENTIFICADO no repositório (externo)**
O código o trata como único escritor de billing/IA: `creditosIA` (saldo/recarga/desconto), `limiteUsuarios` e o webhook de pagamento (`functions/index.js:10,166`). Não há URL, payload ou coleção versionados — impossível confirmar o que ele grava.

### `/api/ai` e `api/telegram-webhook.js`
**Zero Firestore.** Nenhum import de `firebase-admin`/cliente; são proxies HTTP.

## Observações de risco (regras intactas)
1. Coleções **globais sem `oficinaId`** no documento: `leads` (PortalCliente), `acompanhamentos_publicos`, `desmanche_global`, `os`, `vistorias`, `imoveis_imobi`, `tarefas`, `planos`, `ordensServico`.
2. `collectionGroup(db,'imoveis_imobi')` em `PortalCliente.jsx:1530,1644` atravessa tenants (filtrada por `publico == true`).
3. `oficinas/{id}/assinaturas/atual` não aparece em nenhum `collection()` do cliente.
4. `configuracoes/geral` e `os` seguem com `get` público (PII) — auditoria anterior.
