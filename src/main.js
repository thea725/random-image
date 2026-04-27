import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

let imageList = [];
let history = [];
let currentIndex = -1;

const btnSelect = document.getElementById('btn-select');
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const imgViewer = document.getElementById('image-viewer');
const placeholder = document.getElementById('placeholder');

// Event: Pilih Direktori
btnSelect.addEventListener('click', async () => {
  try {
    const selectedPath = await open({ directory: true });
    if (selectedPath) {
      // Panggil command Rust untuk mengambil semua path gambar
      imageList = await invoke('get_images', { dirPath: selectedPath });
      
      if (imageList.length === 0) {
        alert('Tidak ada gambar dengan format didukung (PNG, JPG, dll) di folder ini.');
        return;
      }
      
      // Reset State
      history = [];
      currentIndex = -1;
      btnNext.disabled = false;
      showNextRandom();
    }
  } catch (error) {
    console.error("Error selecting directory:", error);
  }
});

// Event: Random Next
btnNext.addEventListener('click', () => {
  showNextRandom();
});

// Event: Back (History)
btnBack.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderImage();
  }
});

function showNextRandom() {
  if (imageList.length === 0) return;
  
  // Ambil gambar secara random dari directory
  const randomIndex = Math.floor(Math.random() * imageList.length);
  const selectedImage = imageList[randomIndex];
  
  // Jika sedang melihat gambar lama (back), lalu lanjut (next), hapus masa depan historinya
  if (currentIndex < history.length - 1) {
    history = history.slice(0, currentIndex + 1);
  }
  
  history.push(selectedImage);
  currentIndex++;
  renderImage();
}

async function renderImage() {
  try {
    const imagePath = history[currentIndex];
    
    // Minta Rust mengubah file fisik menjadi Base64 agar dapat di-render dengan mudah
    const base64Data = await invoke('load_image_base64', { path: imagePath });
    
    imgViewer.src = base64Data;
    imgViewer.style.display = 'block';
    placeholder.style.display = 'none';
    
    // Disable tombol back jika sedang di gambar urutan pertama
    btnBack.disabled = currentIndex === 0;
  } catch (error) {
    console.error("Gagal memuat gambar:", error);
  }
}