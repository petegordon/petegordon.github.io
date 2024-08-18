  let isShaking = false;
  let shakeTimeout;
  let lastUpdate = 0;
  let lastX = 0;
  let lastY = 0;
  let lastZ = 0;

  function setDiceFace(cube, face) {
    let xDeg, yDeg;
    switch(face) {
      case 1:
        xDeg = 0; yDeg = 0;
        break;
      case 2:
        xDeg = 0; yDeg = 180;
        break;
      case 3:
        xDeg = 0; yDeg = -90;
        break;
      case 4:
        xDeg = 0; yDeg = 90;
        break;
      case 5:
        xDeg = -90; yDeg = 0;
        break;
      case 6:
        xDeg = 90; yDeg = 0;
        break;
      default:
        console.log("Invalid face number");
        return;
    }
    cube.style.transform = 'rotateX('+xDeg+'deg) rotateY('+yDeg+'deg)';
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomRotate(cube) {
    let xRand = getRandomInt(0, 360);
    let yRand = getRandomInt(0, 360);
    cube.style.transform = 'rotateX('+xRand+'deg) rotateY('+yRand+'deg)';
  }

  function rollDice(cube, targetFace, duration) {
    const interval = setInterval(() => randomRotate(cube), 100);
    setTimeout(() => {
      clearInterval(interval);
      setDiceFace(cube, targetFace);
    }, duration);
  }

  function rollBothDice() {
    const face1 = Math.floor(Math.random() * 6) + 1;
    const face2 = Math.floor(Math.random() * 6) + 1;
    console.log("Rolling to faces: " + face1 + " and " + face2);
    rollDice(document.getElementById('cube1'), face1, 500);
    rollDice(document.getElementById('cube2'), face2, 500);
  }

  function deviceMotionHandler(event) {
    const shakeThreshold = 1200;
    const acceleration = event.accelerationIncludingGravity;
    const currentTime = new Date().getTime();

    if (!lastUpdate) {
        lastUpdate = currentTime;
        lastX = acceleration.x;
        lastY = acceleration.y;
        lastZ = acceleration.z;
        return;
    }

    const timeDifference = currentTime - lastUpdate;
    lastUpdate = currentTime;

    const deltaX = acceleration.x - lastX;
    const deltaY = acceleration.y - lastY;
    const deltaZ = acceleration.z - lastZ;

    const speed = Math.abs(deltaX + deltaY + deltaZ) / timeDifference * 10000;

    // Track direction changes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > Math.abs(deltaZ)) {
        // Horizontal shake detected
        if (deltaX > 0 && lastDirectionX <= 0) {
            // Rightward movement detected after a leftward movement
            directionChangedX = true;
        } else if (deltaX < 0 && lastDirectionX >= 0) {
            // Leftward movement detected after a rightward movement
            directionChangedX = true;
        }
        lastDirectionX = deltaX;
    }

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > Math.abs(deltaZ)) {
        // Vertical shake detected
        if (deltaY > 0 && lastDirectionY <= 0) {
            // Upward movement detected after a downward movement
            directionChangedY = true;
        } else if (deltaY < 0 && lastDirectionY >= 0) {
            // Downward movement detected after an upward movement
            directionChangedY = true;
        }
        lastDirectionY = deltaY;
    }

    if (Math.abs(deltaZ) > Math.abs(deltaX) && Math.abs(deltaZ) > Math.abs(deltaY)) {
        // Forward-backward shake detected
        if (deltaZ > 0 && lastDirectionZ <= 0) {
            // Forward movement detected after a backward movement
            directionChangedZ = true;
        } else if (deltaZ < 0 && lastDirectionZ >= 0) {
            // Backward movement detected after a forward movement
            directionChangedZ = true;
        }
        lastDirectionZ = deltaZ;
    }

    // Trigger only after a full shake (both directions detected)
    if (speed > shakeThreshold && directionChangedX && directionChangedY && directionChangedZ && !isShaking) {
        document.getElementById('log').innerText += 'Full Shake Detected! ' + lastUpdate + ' ' + speed + '\n';
        isShaking = true;
        rollBothDice();

        // Reset the direction change flags after the shake
        directionChangedX = false;
        directionChangedY = false;
        directionChangedZ = false;

        clearTimeout(shakeTimeout);
        shakeTimeout = setTimeout(() => {
            isShaking = false;
        }, 500);
    }

    lastX = acceleration.x;
    lastY = acceleration.y;
    lastZ = acceleration.z;
}


  function initializeMotionEvent() {
    document.getElementById('log').innerText = 'Loaded 12: ' + new Date().getTime();
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      alert('about to request permission for Device Motion...');
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
            alert(permissionState)
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', deviceMotionHandler, false);
          } else {
            alert('Device Motion permission denied.');
          }
        })
        .catch( (error) =>
            {
                alert("ERROR:"  + error)
            }
        );
    } else {
      alert('about to add Event Listener for Device Motion...');
      window.addEventListener('devicemotion', deviceMotionHandler, false);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start').addEventListener('click', initializeMotionEvent);
  });