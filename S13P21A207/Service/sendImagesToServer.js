// Node.js Client-side code to send multiple images with metadata via Socket.IO
// Emits the data array and handles server ACK in the emit callback

const fs = require('fs');
const path = require('path');
const { io } = require('socket.io-client');


async function sendImages(socketUrl, imagePaths, pageUrl) {
const socket = io(socketUrl);
  // Build the data array
  // 메타데이터와 바이너리 완전 분리                                                                                                                                                                                             
  const metadata = imagePaths.map((imgPath, idx) => ({
    elementId: `img_${idx + 1}`,
    mimeType: path.extname(imgPath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg',
    size: fs.statSync(imgPath).size,
    pageUrl: pageUrl,
    imageMetadata: { width: 800, height: 600, alt: `Alt text for img_${idx + 1}` },
    imageData: fs.readFileSync(imgPath)  // 바이너리 데이터 포함
  }));
  console.log('Sending metadata:', metadata); 
  setInterval(() => {
    socket.emit('image-analysis',metadata, (ackdata) => {
      console.log('Images and metadata sent successfully. Server ACK:', ackdata);
      socket.disconnect();
    });
  }, 10000);
  
}

// Usage example
const images = ['./shouldGore.jpeg'];  // Replace with actual file paths
const socketServerUrl = 'http://localhost:9092';  // Replace with your server URL
const pageUrl = 'https://news.example.com/article/123';

sendImages(socketServerUrl, images, pageUrl);
