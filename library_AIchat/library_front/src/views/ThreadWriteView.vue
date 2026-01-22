<template>
  <div class="full-page-wrapper">
    <div class="thread-write-container">

      <h1>새로운 쓰레드 작성</h1>

      <form @submit.prevent="submitThread" class="thread-form">
        <p><label for="title">제목</label></p>
        <input type="text" id="title" v-model="title">
        <p><label for="content">내용</label></p>
        <textarea name="content" id="content" v-model="content"></textarea>
        <p><label for="reading_date">읽은 날짜</label></p>
        <input type="date" id="reading_date" v-model="reading_date">

        <p>도서 정보</p>
        <div class="book-info">
          <img :src="book.fields.cover" alt="">
          <div>
            <h4>{{ book.fields.title }}</h4>
            <p>{{ book.fields.author }} | {{ book.fields.publisher }} | {{ book.fields.pub_date }}</p>
            <p>{{ book.fields.subTitle }}</p>
          </div>
        </div>

        <div class="btn-area">
          <RouterLink :to="`/books/${bookId}`" class="btn">취소</RouterLink>
          <input type="submit" class="btn btn-danger" value="작성" />
        </div>

      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import booksData from '@/assets/fixtures/books.json'
import { useAccountStore } from '@/stores/accounts'

const route = useRoute()
const router = useRouter()

const bookId = parseInt(route.params.bookId)
const book = booksData.find(b => b.pk === bookId)
const API_URL = 'http://127.0.0.1:8000'
const accountStore = useAccountStore()
const title = ref('')
const content = ref('')
const reading_date = ref('')

const submitThread = function () {
  axios({
    method: 'POST',
    url: `${API_URL}/api/v1/${bookId}/threads/`,
    data: {
      title: title.value,
      content: content.value,
      reading_date: reading_date.value,
    },
    headers: {
      Authorization: `Token ${accountStore.token}`
    }
  })
    .then((res) => {
      alert('쓰레드가 작성되었습니다!')
      router.push(`/books/${bookId}`)  // 작성 후 도서 상세 페이지로 이동

    })
    .catch((err) => {
      console.error('작성 실패:', err.response?.data || err)
      alert('작성에 실패하였습니다.')
    })
}
</script>

<style scoped>
.thread-write-container {
  background-color: rgb(238, 238, 238);
  width: 500px;
  /* ✅ 최소 가로 길이 설정 */
  margin: 30px auto;
  padding: 40px;
  color: black;
  display: flex;
  flex-direction: column;
  /* min-height: 100vh; */
  border-radius: 10px;
}

.thread-write-container p {
  font-weight: bold;
  font-size: large;
  margin-top: 10px;
  margin-bottom: 5px;
}

.thread-form {
  display: flex;
  flex-direction: column;
}

.thread-form input {
  border-radius: 5px;
  border: 1px solid lightgray;
}

.thread-form textarea {
  border-radius: 5px;
  border: 1px solid lightgray;
}

.book-info {
  width: 400px;
  background-color: rgba(150, 150, 150, 0.219);
  border-radius: 10px;
  padding: 30px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 0 auto;

}

.book-info img {
  width: 100px;
  height: 150px;
  margin-right: 20px
}

.book-info div {
  width: 60%;
  align-self: center;
  line-height: 30px;
}

.book-info div h4 {
  font-weight: bold;
}

.btn-area {
  display: flex;
  align-self: center;
}

.btn {
  border: 1px solid black;
  width: 50%;
  margin: 10px;
}

/* .write-btn {
  background-color: red;
} */
</style>