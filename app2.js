window.onload = function () {
  var video = document.getElementById("video");
  var canvas = document.getElementById("imageCanvas");
  var ctx = canvas.getContext("2d");
  var captureButton = document.getElementById("capture");
  var colorPicker = document.getElementById("colorPicker");

  var canvas = document.getElementById("imageCanvas");
  var ctx = canvas.getContext("2d");
  var imgData;

  // Get access to the camera
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        video.srcObject = stream;
        video.play();
      });
  }

  // Capture the photo
  captureButton.addEventListener("click", function () {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  });
  function handleImage(e) {
    var reader = new FileReader();
    reader.onload = function (event) {
      var img = new Image();
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  }

  canvas.addEventListener("click", function (event) {
    var x = event.offsetX;
    var y = event.offsetY;
    floodFill(ctx, x, y, [255, 0, 0, 255]);
  });
};

function floodFill(ctx, x, y, fillColor) {
  var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  var targetColor = getColorAtPixel(imageData, x, y);
  var pixelsToCheck = [x, y];

  while (pixelsToCheck.length > 0) {
    const y = pixelsToCheck.pop();
    const x = pixelsToCheck.pop();

    const currentColor = getColorAtPixel(imageData, x, y);

    if (!colorsMatch(currentColor, targetColor)) {
      continue;
    }

    setColorAtPixel(imageData, fillColor, x, y);

    if (x > 0) pixelsToCheck.push(x - 1, y);
    if (y > 0) pixelsToCheck.push(x, y - 1);
    if (x < imageData.width - 1) pixelsToCheck.push(x + 1, y);
    if (y < imageData.height - 1) pixelsToCheck.push(x, y + 1);
  }

  ctx.putImageData(imageData, 0, 0);
}

function getColorAtPixel(imageData, x, y) {
  const { data } = imageData;
  const red = data[(y * imageData.width + x) * 4];
  const green = data[(y * imageData.width + x) * 4 + 1];
  const blue = data[(y * imageData.width + x) * 4 + 2];
  const alpha = data[(y * imageData.width + x) * 4 + 3];

  return { r: red, g: green, b: blue, a: alpha };
}

function setColorAtPixel(imageData, color, x, y) {
  const { data } = imageData;
  data[(y * imageData.width + x) * 4] = color[0];
  data[(y * imageData.width + x) * 4 + 1] = color[1];
  data[(y * imageData.width + x) * 4 + 2] = color[2];
  data[(y * imageData.width + x) * 4 + 3] = color[3];
}

function colorsMatch(a, b, tolerance = 10) {
  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance &&
    Math.abs(a.a - b.a) <= tolerance
  );
}
