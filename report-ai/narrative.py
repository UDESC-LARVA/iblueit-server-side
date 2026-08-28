"""
Geração de texto narrativo clínico.

Hoje usa um template determinístico (sem custo, sem chave de API) para que o
fluxo ponta-a-ponta funcione sem depender de uma chave de LLM. Quando houver
uma chave configurada (ANTHROPIC_API_KEY), a função `generate` troca
automaticamente para a chamada real ao modelo, mantendo o mesmo formato de
resposta — nenhuma outra camada do sistema precisa mudar.
"""

import os
from datetime import datetime

AVISO_REVISAO = (
    "Este relatório foi gerado automaticamente por IA e deve ser revisado "
    "pelo profissional responsável antes de ser incorporado ao prontuário clínico."
)

METRIC_LABELS = {
    "DJ": ("Desempenho do Jogador", "índice 0–1"),
    "PJ": ("Pontos da Jogada", "pontos"),
    "CGc": ("Carga Corrente", "cmH2O"),
    "FR": ("Frequência Respiratória", "rpm"),
    "PEmax": ("Pressão Expiratória Máxima", "cmH2O"),
    "PImax": ("Pressão Inspiratória Máxima", "cmH2O"),
    "TEmax": ("Tempo Expiratório Máximo", "s"),
    "TImax": ("Tempo Inspiratório Máximo", "s"),
    "SpO2min": ("Saturação de Oxigênio Mínima", "%"),
    "FLi": ("Fluxo Inspiratório", "L/min"),
    "FLe": ("Fluxo Expiratório", "L/min"),
    "EB": ("Escala de Borg", "0–10"),
}


def _pct_change(current, previous):
    if previous is None or previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 1)


def _trend_word(diff):
    if diff is None:
        return None
    if diff > 0:
        return "melhora"
    if diff < 0:
        return "redução"
    return "estabilidade"


def _format_date(iso_str):
    if not iso_str:
        return "—"
    try:
        return datetime.fromisoformat(iso_str.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except ValueError:
        return iso_str


def _build_resumo(device, period, session_count, current_metrics):
    sessao_txt = "sessão" if session_count == 1 else "sessões"
    periodo_inicio = _format_date(period.get("start"))
    periodo_fim = _format_date(period.get("end"))
    partes = [
        f"No período de {periodo_inicio} a {periodo_fim}, "
        f"o paciente realizou {session_count} {sessao_txt} de reabilitação respiratória "
        f"utilizando o dispositivo {device}."
    ]

    dj = current_metrics.get("DJ")
    pj = current_metrics.get("PJ")
    fr = current_metrics.get("FR")
    eb = current_metrics.get("EB")

    if dj is not None:
        partes.append(f"O Desempenho do Jogador (DJ) médio registrado foi de {dj:.2f}.")
    if pj is not None:
        partes.append(f"A pontuação média (PJ) foi de {pj:.1f} pontos por sessão.")
    if fr is not None:
        partes.append(f"A frequência respiratória (FR) média observada foi de {fr:.0f} rpm.")
    if eb is not None:
        partes.append(f"A Escala de Borg (esforço percebido) média foi de {eb:.1f}.")

    return " ".join(partes)


def _build_analise_comparativa(current_metrics, previous_metrics):
    if not previous_metrics:
        return None

    frases = []
    for key in ("DJ", "PJ", "CGc", "FR", "EB"):
        cur = current_metrics.get(key)
        prev = previous_metrics.get(key)
        if cur is None or prev is None:
            continue
        diff = _pct_change(cur, prev)
        if diff is None:
            continue
        label, _ = METRIC_LABELS[key]
        tendencia = _trend_word(diff)
        if tendencia == "estabilidade":
            frases.append(f"{label} ({key}) manteve-se estável em relação ao período anterior.")
        else:
            frases.append(
                f"{label} ({key}) apresentou {tendencia} de {abs(diff)}% em relação ao "
                f"período anterior (de {prev:.2f} para {cur:.2f})."
            )

    if not frases:
        return None
    return " ".join(frases)


def _build_dados_brutos(current_metrics, metric_sources):
    linhas = []
    for key, valor in current_metrics.items():
        if key not in METRIC_LABELS or valor is None:
            continue
        label, unidade = METRIC_LABELS[key]
        linhas.append({
            "metrica": label,
            "sigla": key,
            "valor": valor,
            "unidade": unidade,
            "sourceCollection": metric_sources.get(key, "—"),
        })
    return linhas


def generate(payload: dict) -> dict:
    """Gera o relatório narrativo a partir das métricas já extraídas do MongoDB.

    `payload` segue o formato montado pela Azure Function GenerateClinicalReport:
    device, period, sessionCount, isFirstReport, currentMetrics, previousMetrics,
    metricSources, patientContext, alerts.
    """
    device = payload.get("device", "Pitaco")
    period = payload.get("period", {})
    session_count = payload.get("sessionCount", 0)
    is_first_report = payload.get("isFirstReport", False)
    current_metrics = payload.get("currentMetrics", {})
    previous_metrics = None if is_first_report else payload.get("previousMetrics")
    metric_sources = payload.get("metricSources", {})

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        return _generate_via_llm(payload, api_key)

    resumo = _build_resumo(device, period, session_count, current_metrics)
    analise = _build_analise_comparativa(current_metrics, previous_metrics)
    if is_first_report:
        analise = (
            "Esta é a sessão de referência inicial do paciente — ainda não há "
            "período anterior para comparação."
        )

    return {
        "resumoSessao": resumo,
        "analiseComparativa": analise,
        "avisoRevisao": AVISO_REVISAO,
        "dadosBrutos": _build_dados_brutos(current_metrics, metric_sources),
        "generatedBy": "template",
    }


def _generate_via_llm(payload: dict, api_key: str) -> dict:
    """Chamada real ao LLM (Claude). Usada automaticamente quando
    ANTHROPIC_API_KEY está configurada no ambiente."""
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)

    device = payload.get("device", "Pitaco")
    period = payload.get("period", {})
    is_first_report = payload.get("isFirstReport", False)
    current_metrics = payload.get("currentMetrics", {})
    previous_metrics = payload.get("previousMetrics")
    patient_context = payload.get("patientContext", {})
    metric_sources = payload.get("metricSources", {})

    prompt = f"""Você é um assistente clínico que auxilia fisioterapeutas respiratórios a
interpretar dados do exergame I Blue It. Gere um relatório clínico narrativo em português,
objetivo e profissional, com base nestes dados:

Dispositivo: {device}
Período: {period.get('start', '—')} a {period.get('end', '—')}
Contexto do paciente: {patient_context}
Primeira sessão do paciente: {is_first_report}
Métricas do período atual: {current_metrics}
Métricas do período anterior: {previous_metrics}

Responda em JSON com as chaves: resumoSessao (2-3 parágrafos), analiseComparativa
(comparação com o período anterior, ou null se for a primeira sessão)."""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    import json as _json
    parsed = _json.loads(response.content[0].text)

    return {
        "resumoSessao": parsed.get("resumoSessao"),
        "analiseComparativa": parsed.get("analiseComparativa"),
        "avisoRevisao": AVISO_REVISAO,
        "dadosBrutos": _build_dados_brutos(current_metrics, metric_sources),
        "generatedBy": "llm",
    }
