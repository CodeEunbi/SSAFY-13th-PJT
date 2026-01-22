# text_split.py
import re, time
from typing import Callable, List, Dict, Tuple

# 인용구 블록을 찾는 패턴
# “…” / ‘…’ / "..." / '...'를 모두 포착
# DOTALL: 줄바꿈 포함 매칭
QUOTE_BLOCK = re.compile(r'“.*?”|‘.*?’|".*?"|\'.*?\'', re.DOTALL)

# 닫는 따옴표 직후에 붙어 있는 문장부호를 인접 토큰으로 묶을지 여부
ATTACH_PUNCT_AFTER_QUOTE = True

# 따옴표 직후 붙을 수 있는 문장부호 집합
PUNCT = re.compile(r'^[\.\,\!\?]+')

# 한 문장 내부를 인용구/비인용구 단위로 분리하는 로직
def split_quotes_local(sentence: str):
    parts, last = [], 0
    for m in QUOTE_BLOCK.finditer(sentence):
        if m.start() > last:
            parts.append((last, m.start()))
        q_start, q_end = m.start(), m.end()
        if ATTACH_PUNCT_AFTER_QUOTE and q_end < len(sentence):
            m2 = PUNCT.match(sentence[q_end:])
            if m2: q_end += m2.end()
        parts.append((q_start, q_end))
        last = q_end
    if last < len(sentence):
        parts.append((last, len(sentence)))
    out = []
    for a, b in parts:
        seg = sentence[a:b]
        if seg and not seg.isspace():
            out.append((a, b))
    return out

# 원문 텍스트를 문장/의미 단위로 분리
# 각 구분단위의 오프셋을 계산
def segment_with_spans(element_text: str,
                       splitter: Callable[[str], List[str]]
                       ) -> Tuple[List[Dict], float, float, float]:
    # 1) 문장 분리 시간 측정
    t0 = time.perf_counter()
    sents = splitter(element_text)
    t1 = time.perf_counter()

    # 2) 문장 절대 오프셋 산출(커서 기반)
    cursor = 0
    results = []
    for s in sents:
        if not s:
            continue
        # 원문에서 'cursor' 이후로만 매칭 → 앞쪽 중복 매치 방지
        s_idx = element_text.find(s, cursor)
        if s_idx == -1:  # 보수 처리
            s_idx = cursor
        s_end = s_idx + len(s)
        cursor = s_end # 커서를 문장 끝으로 옮김

        # 3) 문장 내부 인용구/비인용구 로컬 스팬 -> 절대 스팬 환산
        for a, b in split_quotes_local(s):
            abs_a, abs_b = s_idx + a, s_idx + b
            results.append({"text": element_text[abs_a:abs_b],
                            "start": abs_a,
                            "end": abs_b
                            })
    t2 = time.perf_counter()
    
    # 결과 반환
    return results, (t1 - t0), (t2 - t1), (t2 - t0)
