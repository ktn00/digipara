const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playButton');
const addFrameButton = document.getElementById('addFrameButton');
const deleteFrameButton = document.getElementById('deleteFrameButton');
const timelineContainer = document.getElementById('timeline-container');
const timeline = document.getElementById('timeline');
const framerateSelect = document.getElementById('framerate');

let drawing = false;
let currentPath = [];
let frames = [];
let frameRate = 8;
let animationInterval;
let currentFrameIndex = 0;
let isPlaying = false;
let selectedFrameIndex = -1;

function addFrame() {
  frames.push([...currentPath]);
  currentPath = [];
  updateTimeline();
  selectFrame(frames.length - 1);
}

function deleteFrame(index) {
  if (index >= 0 && index < frames.length) {
    frames.splice(index, 1);
    if (selectedFrameIndex >= frames.length) {
      selectedFrameIndex = frames.length - 1;
    }
    updateTimeline();
    redrawCanvas(selectedFrameIndex);
  }
}

function updateTimeline() {
  timeline.innerHTML = '';
  frames.forEach((frame, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.classList.add('frame-thumbnail');
    thumbnail.textContent = index + 1;
    thumbnail.addEventListener('click', () => {
      selectFrame(index);
    });
    timeline.appendChild(thumbnail);
  });
  const thumbnails = document.querySelectorAll('.frame-thumbnail');
  thumbnails.forEach((thumb, index) => {
    if (index === selectedFrameIndex) {
      thumb.classList.add('selected');
    } else {
      thumb.classList.remove('selected');
    }
  });
  timeline.style.width = (frames.length * 70) + 'px';
}

function selectFrame(index) {
  if (index >= 0 && index < frames.length) {
    selectedFrameIndex = index;
    redrawCanvas(selectedFrameIndex);
    updateTimeline();
  }
}

function drawFrameOnCanvas(frame) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (frame && frame.length > 0) {
    ctx.moveTo(frame[0].x, frame[0].y);
    for (let i = 1; i < frame.length; i++) {
      ctx.lineTo(frame[i].x, frame[i].y);
    }
    ctx.stroke();
  }
}

function redrawCanvas(frameIndex = selectedFrameIndex) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (frameIndex >= 0 && frameIndex < frames.length) {
    frames[frameIndex].forEach(path => { // 各ストローク（連続した点の配列）を描画
      ctx.beginPath();
      if (path.length > 0) {
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }
    });
  }
}

canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  const startPoint = { x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop };
  currentPath.push([startPoint]); // 新しいストローク（点の配列）を開始
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const currentPoint = { x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop };
  currentPath[currentPath.length - 1].push(currentPoint); // 現在のストロークに点を追加
  redrawCanvas(selectedFrameIndex);
  // 現在の描画プレビュー
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (currentPath.length > 0 && currentPath[currentPath.length - 1].length > 0) {
    ctx.moveTo(currentPath[currentPath.length - 1][0].x, currentPath[currentPath.length - 1][0].y);
    for (let i = 1; i < currentPath[currentPath.length - 1].length; i++) {
      ctx.lineTo(currentPath[currentPath.length - 1][i].x, currentPath[currentPath.length - 1][i].y);
    }
    ctx.stroke();
  }
});

canvas.addEventListener('mouseup', () => {
  drawing = false;
  if (selectedFrameIndex === -1 || selectedFrameIndex === frames.length) {
    addFrame();
  } else {
    frames[selectedFrameIndex] = [...frames[selectedFrameIndex] || [], ...currentPath];
    updateTimeline();
    redrawCanvas(selectedFrameIndex);
    currentPath = [];
  }
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); // デフォルトのタッチ操作を防止
  drawing = true;
  const touch = e.touches[0];
  const startPoint = { x: touch.clientX - canvas.offsetLeft, y: touch.clientY - canvas.offsetTop };
  currentPath.push([startPoint]);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault(); // デフォルトのタッチ操作を防止
  if (!drawing) return;
  const touch = e.touches[0];
  const currentPoint = { x: touch.clientX - canvas.offsetLeft, y: touch.clientY - canvas.offsetTop };
  currentPath[currentPath.length - 1].push(currentPoint);
  redrawCanvas(selectedFrameIndex);
  // 現在の描画プレビュー（タッチ操作用）
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (currentPath.length > 0 && currentPath[currentPath.length - 1].length > 0) {
    ctx.moveTo(currentPath[currentPath.length - 1][0].x, currentPath[currentPath.length - 1][0].y);
    for (let i = 1; i < currentPath[currentPath.length - 1].length; i++) {
      ctx.lineTo(currentPath[currentPath.length - 1][i].x, currentPoint.y);
    }
    ctx.stroke();
  }
});

canvas.addEventListener('touchend', () => {
  drawing = false;
  if (selectedFrameIndex === -1 || selectedFrameIndex === frames.length) {
    addFrame();
  } else {
    frames[selectedFrameIndex] = [...frames[selectedFrameIndex] || [], ...currentPath];
    updateTimeline();
    redrawCanvas(selectedFrameIndex);
    currentPath = [];
  }
});

function playAnimation() {
  if (isPlaying || frames.length === 0) return;
  isPlaying = true;
  playButton.textContent = '停止';
  currentFrameIndex = 0;
  clearInterval(animationInterval);
  animationInterval = setInterval(() => {
    drawFrameForAnimation(frames[currentFrameIndex]);
    currentFrameIndex = (currentFrameIndex + 1) % frames.length;
  }, 1000 / frameRate);
}

function stopAnimation() {
  isPlaying = false;
  playButton.textContent = '再生';
  clearInterval(animationInterval);
  if (frames.length > 0) {
    redrawCanvas(currentFrameIndex > 0 ? currentFrameIndex - 1 : 0);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function drawFrameForAnimation(frame) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (frame) {
    frame.forEach(path => {
      ctx.beginPath();
      if (path.length > 0) {
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }
    });
  }
}

playButton.addEventListener('click', () => {
  if (isPlaying) {
    stopAnimation();
  } else {
    playAnimation();
  }
});

addFrameButton.addEventListener('click', () => {
  addFrame();
});

deleteFrameButton.addEventListener('click', () => {
  deleteFrame(selectedFrameIndex);
});

framerateSelect.addEventListener('change', () => {
  frameRate = parseInt(framerateSelect.value, 10);
  if (isPlaying) {
    playAnimation(); // 再生中に変更された場合はアニメーションを再開
  }
});

updateTimeline();
redrawCanvas();
