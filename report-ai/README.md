# I Blue It — Report AI

Serviço Python (FastAPI) responsável por gerar o texto narrativo do relatório
clínico a partir das métricas já extraídas do MongoDB pela Azure Function
`GenerateClinicalReport` (repositório `iblueit-server-side`). Corresponde ao
componente `URL_API_IA` descrito no RFC.

## Rodando localmente

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Endpoint principal: `POST http://localhost:8000/generate-report`

## Geração de texto: template vs. LLM

Por padrão, o texto narrativo é gerado por um **template determinístico**
(sem custo, sem chave de API) — suficiente para desenvolver e testar o fluxo
ponta-a-ponta. Quando a variável de ambiente `ANTHROPIC_API_KEY` estiver
configurada, o serviço passa a usar automaticamente o modelo Claude para
gerar o texto (mesmo formato de resposta, nenhuma outra parte do sistema
precisa mudar).

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```
