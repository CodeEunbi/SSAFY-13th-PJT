#!/usr/bin/env python3
"""
AI Text Service API 테스트 코드
FastAPI 서버가 localhost:8000에서 실행 중이어야 함
"""

import requests
import json
import time

# API 서버 URL
BASE_URL = "http://localhost:8000"

def test_health_check():
    """헬스 체크 테스트"""
    print("=== Health Check Test ===")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        print(f"Health check failed: {e}")
        return False

def test_filter_page():
    """페이지 필터링 테스트"""
    print("\n=== Filter Page Test ===")
    
    # 테스트 데이터
    test_data = {
        "pageUrl": "https://example.com",
        "textElements": [
            {
                "elementId": "elem_1",
                "texts": [
                    {
                        "text": "주요셉 반동성애기독시민연대대표가 2년4개월 전인 2023년 5월25일 인권위에 낸 이 진정은 이충상 전 상임위원을 피해자로, 송두환 전 위원장을 피진정인으로 한 것이었다. 진정의 내용은 이충상 상임위원이 '군 신병 훈련소 인권상황 개선 권고의 건'과 관련 해병대 훈련병의 두발 기준에 관한 다수의견 반대 이유를 설명한다며 적었다가 뺀 \"자의로 기저귀를 차며 성관계를 하는 게이(남성 동성애자)가 인권침해를 당하고 있다는 사실을…\"이라는 내용이 외부(언론)에 공개돼 인격권이 침해됐다는 것이다. 2023년 5월19일 제19차 상임위원회에서 남규선 상임위원은 구체적인 내용은 언급하지 않고 해당 표현의 재고를 간곡히 요청했고, 이충상 상임위원은 회의 뒤 이를 삭제하기로 했다. 그러나 내부망 자유게시판에 직원이 그 내용을 올리면서 언론에 보도됐다. 이충상 전 상임위원은 해당 언론 보도로 자신의 명예가 훼손됐다며 한겨레를 상대로 소송을 내기도 했으나, 2024년 진행된 1·2심에서 모두 패소했다. 대법원은 지난 1월 패소 판결을 최종 확정했다.",
                        "sIdx": 0,
                        "eIdx": 0
                    }
                ]
            },
            {
                "elementId": "elem_2",
                "texts": [
                    {
                        "text": "주요셉 반동성애기독시민연대대표가 2년4개월 전인 2023년 5월25일 인권위에 낸 이 진정은 이충상 전 상임위원을 피해자로, 송두환 전 위원장을 피진정인으로 한 것이었다. 진정의 내용은 이충상 상임위원이 '군 신병 훈련소 인권상황 개선 권고의 건'과 관련 해병대 훈련병의 두발 기준에 관한 다수의견 반대 이유를 설명한다며 적었다가 뺀 \"자의로 기저귀를 차며 성관계를 하는 게이(남성 동성애자)가 인권침해를 당하고 있다는 사실을…\"이라는 내용이 외부(언론)에 공개돼 인격권이 침해됐다는 것이다. 2023년 5월19일 제19차 상임위원회에서 남규선 상임위원은 구체적인 내용은 언급하지 않고 해당 표현의 재고를 간곡히 요청했고, 이충상 상임위원은 회의 뒤 이를 삭제하기로 했다. 그러나 내부망 자유게시판에 직원이 그 내용을 올리면서 언론에 보도됐다. 이충상 전 상임위원은 해당 언론 보도로 자신의 명예가 훼손됐다며 한겨레를 상대로 소송을 내기도 했으나, 2024년 진행된 1·2심에서 모두 패소했다. 대법원은 지난 1월 패소 판결을 최종 확정했다.",
                        "sIdx": 0,
                        "eIdx": 0
                    }
                ]
            }
        ],
        "textFilterCategory": {
            "IN": False,
            "PO": False,
            "AD": True,
            "SE": True
        }
    }
    
    try:
        print("Sending request...")
        start_time = time.time()
        
        response = requests.post(
            f"{BASE_URL}/filter_page",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30  # 30초 타임아웃
        )
        
        end_time = time.time()
        
        print(f"Status Code: {response.status_code}")
        print(f"Request Time: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            # 결과 분석
            print(f"\n--- Analysis ---")
            print(f"Page URL: {result['pageUrl']}")
            print(f"Processing Time: {result['processingTime']:.3f}s")
            print(f"Total Texts: {result['totalTexts']}")
            print(f"Filtered Elements: {len(result['filteredElements'])}")
            
            for elem in result['filteredElements']:
                print(f"\nElement ID: {elem['elementId']}")
                print(f"Filtered Texts Count: {len(elem['filteredTexts'])}")
                for i, ft in enumerate(elem['filteredTexts']):
                    print(f"  Text {i+1}: {ft['text'][:100]}...")
                    print(f"  Labels: {ft['detectedLabels']}")
                    print(f"  Confidence: {ft.get('confidence', 'N/A')}")
            
            return True
        else:
            print(f"Error Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("Request timed out (30s)")
        return False
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return False

def test_single_predict():
    """단일 텍스트 예측 테스트"""
    print("\n=== Single Predict Test ===")
    
    test_text = "이거 보니까 울나라 음악방송 의상규제가 얼마나 독한지 알겠다 ㅋㅋㅋ 해외가면 이렇게 섹시하게 입을 수 있는데 울나라는 아직도 조선시대임 여가부 없애라"
    
    try:
        response = requests.post(
            f"{BASE_URL}/predict",
            params={"text": test_text, "threshold": 0.5},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return False

def test_get_labels():
    """라벨 목록 조회 테스트"""
    print("\n=== Get Labels Test ===")
    
    try:
        response = requests.get(f"{BASE_URL}/labels")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Available Labels: {result['labels']}")
            print(f"Descriptions: {json.dumps(result['descriptions'], indent=2, ensure_ascii=False)}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return False

def main():
    """모든 테스트 실행"""
    print("AI Text Service API Test Started")
    print("=" * 50)
    
    # 1. 헬스 체크
    if not test_health_check():
        print("❌ Health check failed. Is the server running?")
        return
    print("✅ Health check passed")
    
    # 2. 라벨 목록 조회
    if test_get_labels():
        print("✅ Get labels passed")
    else:
        print("❌ Get labels failed")
    
    # 3. 단일 예측 테스트
    if test_single_predict():
        print("✅ Single predict passed")
    else:
        print("❌ Single predict failed")
    
    # 4. 페이지 필터링 테스트 (메인 테스트)
    if test_filter_page():
        print("✅ Filter page passed")
    else:
        print("❌ Filter page failed")
    
    print("\n" + "=" * 50)
    print("Test completed")

if __name__ == "__main__":
    main()