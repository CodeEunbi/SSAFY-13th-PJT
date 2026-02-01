# final-pjt

독후감 작성 & AI 작가와의 대화 프로젝트

### 개인적 감상: 
- 예상외로 정말 힘들었다. 쉽게 생각했던 부분이 잘 안되고, 아무리 고쳐봐도 계속 출력되지 않았을 때 정말 힘들었다. 
- - 하지만 너무 에러가 많을 땐, 잠깐 쉬었다가 돌아와서 확인하면 문제점이 보이기도 했다. 
잠깐씩 쉬면서 하는게 정말 중요한 것 같다. 

- 팀원과의 소통이 정말 중요하다고 느꼈다. 
- - 각자 맡은 일을 잘 하려고 하려해도, 알지 못한 부분에서 다른 사람의 코드를 건들거나, 변수를 혼자 정해 작성하는 경우도 있었다. 그럴 때 마다 최대한 인지하고 소통하려고 했지만, 더 자주 해야한다고 느꼈다. 

- 팀원과의 역할/업무 분담에 대해서 정말 많이 배우게 되었다. 
- - 처음엔 백엔드, 프론트엔드로 나눠서 작업했다. 유저 기능을 만들고, AI 챗봇으로 넘어갔을 땐 역할을 바꿔 프론트, 백엔드로 변경해봤다. 그런데 어느 순간부터인가 한 사람이 두개를 모두 건들고 있더라... 
- - 서로를 믿고, 공유해야 할 부분은 확실히 공유하며 진행해야 한다는 사실을 머리에 인지하고 있다가도, 집중하며 하다보면 서로의 영역을 침범하게 되었다. 
- - 프론트와 백 / 겹치지 않는 기능별 <- 이런 식 으로 다양하게 역할을 나눠서 진행해볼 수 있었는데, 각자 장단점이 있는 것 같았다. 
- 프론트와 백 : 명확한 각자의 할 일, 하지만 훨씬 많은 소통이 필요함
- 겹치지 않는 기능별 : 하나의 기능에 대해, 수업시간에 배웠던 부분을 활용하며 혼자 진행하기 적합. 하지만 조금이라도 겹치는 부분이 있을 시 꼬이기 쉽다. 

----

## ✅ 문제점

1. **`AttributeError: 'str' object has no attribute 'get'`**
   - `book_data.get("author", {}).get("info", "")` 코드에서 `author`가 문자열이었기 때문에 `.get()` 사용 불가.
   - 원인: `author`는 객체가 아니라 단순 문자열(예: `"J.K. Rowling"`).

2. **페르소나 프롬프트에 정보가 정확히 반영되지 않음**
   - 작가 이름(`author`)과 작가 소개(`author_info`)를 분리해서 전달하지 않음.
   - 프롬프트가 부실하여 AI 응답 품질이 낮아질 수 있었음.

3. **OpenAI API Key 에러**
   - `.env` 파일에 `OPENAI_API_KEY=[your_key]`를 넣었지만,
   - 환경 변수를 불러오지 않아 `"api_key must be set"` 에러 발생.

4. **프론트에서 페르소나 상태가 항상 null**
   - 서버에서 반환된 `persona` 정보를 저장하지 않거나,
   - 응답에서 빠졌을 가능성.

---

## ✅ 해결 방법

1. **작가 정보 분리하여 접근**
   ```python
   author_name = book_data.get("author", "")
   author_info = book_data.get("author_info", "")
   ```

2. **정제된 프롬프트 구성**
   ```python
   prompt = f"""당신은 이 책의 작가로써, 이 책에 대한 내용과 작가의 배경을 토대로 답변하는 작가AI 입니다.
   책 내용: {book_content}
   작가: {author_name}
   저자 정보: {author_info}
   사용자 질문: {question}
   3줄 이내로 설명해줘. 추가 정보는 인터넷에서 검색하고, 정확한 정보가 아니라면 너의 추론이라고 꼭 붙여서 대답해줘.
   답변:"""
   ```

3. **환경 변수 적용**
   - `python-dotenv` 설치:
     ```bash
     pip install python-dotenv
     ```
   - `.env` 파일에 API 키 추가:
     ```
     OPENAI_API_KEY=your_openai_key
     ```
   - 코드 상단에 추가:
     ```python
     from dotenv import load_dotenv
     load_dotenv()
     ```

4. **프론트에서 persona 저장 로직 추가**
   ```js
   if (res.data.persona) {
     personas.value[bookId] = res.data.persona
   }
   ```

---

## ✅ 배운 점

- **데이터 형식을 정확히 파악하고 다뤄야 한다**
  - 문자열과 객체의 차이로 인한 에러를 주의해야 함.

- **좋은 프롬프트는 AI 응답 품질을 높인다**
  - 맥락 있는 작가 정보, 책 내용이 포함된 프롬프트가 중요함.

- **환경 변수는 `load_dotenv()`로 꼭 불러와야 한다**
  - `.env`만으로는 설정이 적용되지 않음.

- **디버깅이 곧 실력이다**
  - 로그 출력, 에러 메시지 확인 등으로 빠르게 원인 파악 가능.

- **프론트-백엔드 연동 시, 상태 관리를 철저히 해야 한다**
  - `book.pk`, `persona`, `message` 흐름이 정확히 연결되어야 함.

- **역참조 관계는 `source='related_name'`으로 Serializer에 포함할 수 있다**  
  - `Book` 모델에는 직접적으로 `threads` 필드가 없지만, `Thread` 모델에서 `book = ForeignKey(Book)`로 연결되어 있어 역참조 가능  
  - 이를 `BookSerializer`에 포함하려면 아래처럼 작성:
    ```python
    threads = ThreadSerializer(many=True, read_only=True, source='thread_set')
    ```
  - 또는 `related_name='threads'`로 명시해 관리 용이하게 설정 가능:
    ```python
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='threads')
    ```

- **view 없이도 특정 API 요청을 자동으로 실행할 수 있다 (클라이언트 요청 시)**  
  - `book_detail` 호출 시, 해당 book에 대한 thread 목록을 포함하고 싶다면 별도 뷰 없이도 serializer 안에서 thread 포함 가능

- **프론트에서 `<script setup>` 내부에 명시하지 않아도 되는 데이터는 백엔드에서 충분히 반환되면 된다**  
  - thread 리스트를 별도로 명시할 필요 없이, 백엔드 응답에 포함되기만 하면 프론트에서 사용할 수 있음

- **Django REST Framework에서 Serializer `read_only_fields` 활용법**  
  - 외부에서 수정하면 안 되는 필드는 `read_only_fields`에 명시해 API 안전성 확보 가능

- **프론트-백엔드 간 데이터 필드명이 정확히 일치해야 상태 관리가 깔끔하다**  
  - 예: `book_id` vs `book.pk` 같은 변수명이 틀리면 데이터 연결이 깨짐

- **API 응답 데이터는 클라이언트 상태관리 라이브러리(예: Pinia, Vuex)에서 체계적으로 저장하고 관리해야 한다**  
  - 분산된 데이터를 한데 모으고, 컴포넌트 재사용성을 높임
