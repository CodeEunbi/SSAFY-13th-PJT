<template>
  <div class="chat-wrapper">
    <h3>작가에게 질문해보세요!</h3>
    <div class="warning">
      <p>실제 작가가 아님을 알려드립니다</p>
      <p v-if="chatStore.error">{{ chatStore.error }}</p>

      <div class="chat-box">
        <div 
          v-for="(msg, index) in chatStore.messages"
          :key="index"
          :class="['message', msg.sender]"
        >
          {{ msg.text }}
        </div>
      </div>

      <div class="input-row">
        <input 
          v-model="question"
          type="text"
          placeholder="질문을 입력하세요"
          @keyup.enter="send"
        />
        <button @click="send">전송</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch,onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useAccountStore } from '@/stores/accounts'
import booksData from '@/assets/fixtures/books.json'

// 라우터에서 bookId 가져오기
const route = useRoute()
const bookId = parseInt(route.params.bookId)

// books.json에서 해당 책 찾기 + 평탄화
const rawBook = booksData.find(book => book.pk === bookId)
const book = rawBook ? { ...rawBook.fields, pk: rawBook.pk } : null

const chatStore = useChatStore()
const accountStore = useAccountStore()
const question = ref('')


onMounted(async () => {

  console.log('[DEBUG] 저장된 토큰:', accountStore.token)

  console.log('로그인 여부:', accountStore.isLogin)
  console.log('유저 정보:', accountStore.user)

  if (!book || !book.pk) return

  // ✅ 페르소나 보장
  const result = await chatStore.ensurePersona(book.pk)
  if (!result) return  // 실패 시 처리

  // ✅ 대화 불러오기
  await chatStore.loadConversation(book.pk)

  // ✅ 책 선택
  chatStore.setCurrentBook(book.pk)
})

// 현재 책에 대한 메시지 불러오기
watch(() => bookId, () => {
  if (book?.pk) {
    chatStore.setCurrentBook(book.pk)
  }
}, { immediate: true })

// 질문 전송
function send() {
  if (!question.value.trim()) return
  chatStore.sendMessage(question.value, book)
  question.value = ''
}
</script>

<style scoped>
.chat-wrapper {
  max-width: 600px;
  margin: 2rem auto;
  text-align: center;
}

.warning {
  color: gray;
  margin-bottom: 1rem;
}

.chat-box {
  min-height: 200px;
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid white;
  padding: 1rem;
  margin-bottom: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message {
  display: inline-block;
  padding: 0.5rem;
  border-radius: 8px;
  max-width: 80%;
  word-break: break-word;
}

.user {
  align-self: flex-end;
  background-color: #d9faff;
  text-align: right;
}

.bot {
  align-self: flex-start;
  background-color: #e9ffe0;
  text-align: left;
}

.input-row {
  display: flex;
  gap: 0.5rem;
}

input {
  flex: 1;
  padding: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
}
</style>
