window.onload = function () {
  var video = document.getElementById("video");
  var canvas = document.getElementById("imageCanvas");
  var ctx = canvas.getContext("2d");
  var captureButton = document.getElementById("capture");
  var colorPicker = document.getElementById("colorPicker");
  var toleranceSlider = document.getElementById("tolerance");

  // Specify the back camera
  var constraints = {
    video: { facingMode: "environment" },
  };

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        video.srcObject = stream;
        video.play();
      })
      .catch(function (error) {
        console.error("Cannot access camera: ", error);
      });
  }

  captureButton.addEventListener("click", function () {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  });

  canvas.addEventListener("click", function (event) {
    var x = event.offsetX;
    var y = event.offsetY;
    var chosenColor = hexToRgb(colorPicker.value);
    var tolerance = parseInt(toleranceSlider.value);
    floodFill(
      ctx,
      x,
      y,
      [chosenColor.r, chosenColor.g, chosenColor.b, 255],
      tolerance
    );
  });
};

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function floodFill(ctx, x, y, fillColor, tolerance) {
  var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  var targetColor = getColorAtPixel(imageData, x, y);
  var pixelsToCheck = [x, y];

  while (pixelsToCheck.length > 0) {
    const y = pixelsToCheck.pop();
    const x = pixelsToCheck.pop();

    const currentColor = getColorAtPixel(imageData, x, y);

    if (!colorsMatch(currentColor, targetColor, tolerance, imageData, x, y)) {
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

function adjustLuminance(originalColor, newColor) {
  // Calculate luminance of the original color
  let originalLuminance =
    0.3 * originalColor[0] + 0.59 * originalColor[1] + 0.11 * originalColor[2];
  let newLuminance =
    0.3 * newColor[0] + 0.59 * newColor[1] + 0.11 * newColor[2];

  // Calculate adjustment factor
  let adjustmentFactor = originalLuminance / newLuminance;

  // Adjust the new color's luminance
  return [
    Math.min(newColor[0] * adjustmentFactor, 255),
    Math.min(newColor[1] * adjustmentFactor, 255),
    Math.min(newColor[2] * adjustmentFactor, 255),
    255,
  ];
}

function setColorAtPixel(imageData, newColor, x, y) {
  const { data } = imageData;
  let index = (y * imageData.width + x) * 4;
  let originalColor = [
    data[index],
    data[index + 1],
    data[index + 2],
    data[index + 3],
  ];

  let adjustedColor = adjustLuminance(originalColor, newColor);

  data[index] = adjustedColor[0];
  data[index + 1] = adjustedColor[1];
  data[index + 2] = adjustedColor[2];
  data[index + 3] = 255; // Keep alpha as it is
}

function colorsMatch(a, b, tolerance, imageData, x, y) {
  // Basic distance check
  let distance = Math.sqrt(
    Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2)
  );
  if (distance > tolerance) {
    return false;
  }

  // Edge detection logic
  let edgeThreshold = 15; // Adjust this threshold based on your needs
  if (isNearEdge(imageData, x, y, edgeThreshold)) {
    // Increase tolerance near edges
    return distance < tolerance * 1.5;
  }

  return true;
}

function isNearEdge(imageData, x, y, threshold) {
  let colorVariation = 0;
  let totalChecked = 0;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue; // Skip the center pixel

      let neighbor = getColorAtPixel(imageData, x + dx, y + dy);
      let center = getColorAtPixel(imageData, x, y);

      colorVariation += Math.sqrt(
        Math.pow(center.r - neighbor.r, 2) +
          Math.pow(center.g - neighbor.g, 2) +
          Math.pow(center.b - neighbor.b, 2)
      );
      totalChecked++;
    }
  }

  let averageVariation = colorVariation / totalChecked;
  return averageVariation > threshold;
}
