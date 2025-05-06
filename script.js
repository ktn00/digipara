const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const playButton = document.getElementById('playButton');
const addFrameButton = document.getElementById('addFrameButton');
const insertFrameButton = document.getElementById('insertFrameButton');
const deleteFrameButton = document.getElementById('deleteFrameButton');
const undoButton = document.getElementById('undoButton');
const timelineContainer = document.getElementById('timeline-container');
const timeline = document.getElementById('timeline');
const framerateSelect = document.getElementById('framerate');
const blackPenButton = document.getElementById('blackPenButton');
const eraserButton = document.getElementById('eraserButton'); // ★ 消しゴムボタン

let drawing = false;
let currentPath = [];
let frames = [];
let frameRate = 4;
let animationInterval;
let currentFrameIndex = 0;
let isPlaying = false;
let selectedFrameIndex = -1;
let drawingHistory = [];
let penColor = 'black';
let isErasing = false; // ★ 消しゴムモードの状態を管理する変数

blackPenButton.classList.add('active-tool');

function addFrame() {
  frames.push([...currentPath]);
  currentPath = [];
  drawingHistory = [];
  updateTimeline();
  selectFrame(frames.length - 1);
}

function insertFrameAfterSelected() {
  if (selectedFrameIndex !== -1 && selectedFrameIndex < frames.length) {
    const newFrame = [...currentPath];
    frames.splice(selectedFrameIndex + 1, 0, newFrame);
    currentPath = [];
    drawingHistory = [];
    updateTimeline();
    selectFrame(selectedFrameIndex + 1);
  } else if (frames.length === 0) {
    addFrame();
  }
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

function selectFrame(index) {
  if (index >= 0 && index < frames.length) {
    selectedFrameIndex = index;
    redrawCanvas(selectedFrameIndex);
    drawingHistory = frames[selectedFrameIndex] ? frames[selectedFrameIndex].map(path => [...path]) : [];
    updateTimeline();
  }
}

function updateTimeline() {
  timeline.innerHTML = '';
  frames.forEach((frame, index) => {
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.classList.add('frame-thumbnail');
    thumbnailContainer.style.position = 'relative';
    thumbnailContainer.dataset.index = index;

    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailWidth = 96;
    const thumbnailHeight = 54;
    thumbnailCanvas.width = thumbnailWidth;
    thumbnailCanvas.height = thumbnailHeight;
    thumbnailCanvas.style.position = 'absolute';
    thumbnailCanvas.style.top = '0';
    thumbnailCanvas.style.left = '0';

    const thumbCtx = thumbnailCanvas.getContext('2d');
    thumbCtx.lineWidth = 2;
    thumbCtx.strokeStyle = 'black';
    thumbCtx.lineJoin = 'round';
    thumbCtx.lineCap = 'round';
    thumbCtx.clearRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
    thumbCtx.beginPath();

    frame.forEach(path => {
      if (path.length > 0) {
        const scaleX = thumbnailCanvas.width / canvas.width;
        const scaleY = thumbnailCanvas.height / canvas.height;

        thumbCtx.moveTo(path[0].x * scaleX, path[0].y * scaleY);
        for (let i = 1; i < path.length; i++) {
          thumbCtx.lineTo(path[i].x * scaleX, path[i].y * scaleY);
        }
        thumbCtx.stroke();
      }
    });

    thumbnailContainer.appendChild(thumbnailCanvas);
    thumbnailContainer.addEventListener('click', () => {
      selectFrame(index);
    });
    timeline.appendChild(thumbnailContainer);
  });

  const thumbnails = document.querySelectorAll('.frame-thumbnail');
  thumbnails.forEach((thumb, index) => {
    thumb.classList.remove('playing');
    if (index === selectedFrameIndex) {
      thumb.classList.add('selected');
    } else {
      thumb.classList.remove('selected');
    }
  });
  timeline.style.width = (frames.length * 106) + 'px';
}

function drawFrameOnCanvas(frame) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = penColor;
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
    frames[frameIndex].forEach(path => {
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
  if (!isErasing) {
    currentPath.push([startPoint]);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const currentPoint = { x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop };
  if (!isErasing) {
    currentPath[currentPath.length - 1].push(currentPoint);
    redrawCanvas(selectedFrameIndex);
    ctx.lineWidth = 3;
    ctx.strokeStyle = penColor;
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
  } else {
    // 消しゴムモード：指定した範囲の描画データを削除
    const eraserSize = 10; // 消しゴムのサイズ
    const x = currentPoint.x;
    const y = currentPoint.y;

    if (selectedFrameIndex !== -1 && frames[selectedFrameIndex]) {
      frames[selectedFrameIndex] = frames[selectedFrameIndex].filter(path => {
        return !path.some(point => {
          return point.x > x - eraserSize && point.x < x + eraserSize &&
                 point.y > y - eraserSize && point.y < y + eraserSize;
        });
      });
      redrawCanvas(selectedFrameIndex);
    }
  }
});

document.addEventListener('mouseup', () => {
  drawing = false;
});

canvas.addEventListener('mouseup', () => {
  if (drawing && !isErasing) {
    drawing = false;
    if (selectedFrameIndex !== -1) {
      drawingHistory.push([...currentPath]);
      if (!frames[selectedFrameIndex]) {
        frames[selectedFrameIndex] = [];
      }
      frames[selectedFrameIndex].push([...currentPath[0]]);
      updateTimeline();
      redrawCanvas(selectedFrameIndex);
    } else {
      addFrame();
    }
    currentPath = [];
  }
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  drawing = true;
  const touch = e.touches[0];
  const startPoint = { x: touch.clientX - canvas.offsetLeft, y: touch.clientY - canvas.offsetTop };
  if (!isErasing) {
    currentPath.push([startPoint]);
  }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!drawing) return;
  const touch = e.touches[0];
  const currentPoint = { x: touch.clientX - canvas.offsetLeft, y: touch.clientY - canvas.offsetTop };
  if (!isErasing) {
    currentPath[currentPath.length - 1].push(currentPoint);
    redrawCanvas(selectedFrameIndex);
    ctx.lineWidth = 3;
    ctx.strokeStyle = penColor;
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
  } else {
    // 消しゴムモード（タッチ操作）：指定した範囲の描画データを削除
    const eraserSize = 10; // 消しゴムのサイズ
    const x = currentPoint.x;
    const y = currentPoint.y;

    if (selectedFrameIndex !== -1 && frames[selectedFrameIndex]) {
      frames[selectedFrameIndex] = frames[selectedFrameIndex].filter(path => {
        return !path.some(point => {
          return point.x > x - eraserSize && point.x < x + eraserSize &&
                 point.y > y - eraserSize && point.y < y + eraserSize;
        });
      });
      redrawCanvas(selectedFrameIndex);
    }
  }
});

canvas.addEventListener('touchend', () => {
  drawing = false;
  if (selectedFrameIndex !== -1 && !isErasing) {
    drawingHistory.push([...currentPath]);
    if (!frames[selectedFrameIndex]) {
      frames[selectedFrameIndex] = [];
    }
    frames[selectedFrameIndex].push([...currentPath[0]]);
    updateTimeline();
    redrawCanvas(selectedFrameIndex);
  }
  currentPath = [];
});

function playAnimation() {
  if (isPlaying || frames.length === 0) return;
  isPlaying = true;
  playButton.textContent = '停止';
  currentFrameIndex = 0;
  clearInterval(animationInterval);
  animationInterval = setInterval(() => {
    drawFrameForAnimation(frames[currentFrameIndex]);
    const thumbnails = document.querySelectorAll('.frame-thumbnail');
    thumbnails.forEach((thumb, index) => {
      thumb.classList.remove('playing');
      if (index === currentFrameIndex) {
        thumb.classList.add('playing');
      }
    });
    currentFrameIndex = (currentFrameIndex + 1) % frames.length;
  }, 1000 / frameRate);
}

function stopAnimation() {
  isPlaying = false;
  playButton.textContent = '再生';
  clearInterval(animationInterval);
  const thumbnails = document.querySelectorAll('.frame-thumbnail');
  thumbnails.forEach((thumb, index) => {
    thumb.classList.remove('playing');
  });
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

undoButton.addEventListener('click', () => {
  undoLastStroke();
});

function undoLastStroke() {
  if (selectedFrameIndex !== -1 && drawingHistory.length > 0) {
    drawingHistory.pop();
    if (drawingHistory.length > 0) {
      currentPath = [...drawingHistory[drawingHistory.length - 1]];
    } else {
      currentPath = [];
    }
    frames[selectedFrameIndex] = drawingHistory.flat();
    redrawCanvas(selectedFrameIndex);
    updateTimeline();
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
  insertFrameAfterSelected();
});

deleteFrameButton.addEventListener('click', () => {
  deleteFrame(selectedFrameIndex);
});

framerateSelect.addEventListener('change', () => {
  frameRate = parseInt(framerateSelect.value, 10);
  if (isPlaying) {
    playAnimation();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    undoLastStroke();
  }
});

blackPenButton.addEventListener('click', () => {
  penColor = 'black';
  isErasing = false;
  blackPenButton.classList.add('active-tool');
  eraserButton.classList.remove('active-tool');
});

eraserButton.addEventListener('click', () => {
  penColor = 'white'; // 消しゴムの色は背景色と同じに
  isErasing = true; // 消しゴムモードを有効にする
  eraserButton.classList.add('active-tool');
  blackPenButton.classList.remove('active-tool');
});

updateTimeline();
redrawCanvas();
