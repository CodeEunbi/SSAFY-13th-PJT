<template>
  
  <RouterLink
  class="chatbot-button" 
  :to="{ name: 'chatbot', params: { bookId: book.pk } }">
    🤖
  </RouterLink>
</template>

<script setup>
const props = defineProps({
  book: Object
})
</script>

<style scoped>
.chatbot-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  background-color: #007aff;
  color: white;
  font-size: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

/* .chatbot-popup {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 360px;
  max-height: 500px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 12px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
} */
</style>
