  let isShaking = false;
  let shakeTimeout;
  let lastUpdate = 0;
  let lastX = 0;
  let lastY = 0;
  let lastZ = 0;

  let shakeStarted = false;
  let shakeDirectionChanged = false;
  let lastShakeTime = 0;
  
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

    if (speed > shakeThreshold) {
        if (deltaX > deltaY && deltaX > deltaZ) {
            document.getElementById('log').innerText += 'X axis shake detected\n';
        }
        if (deltaY > deltaX && deltaY > deltaZ) {
            document.getElementById('log').innerText += 'Y axis shake detected\n';
        }
        if (deltaZ > deltaX && deltaZ > deltaY) {
            document.getElementById('log').innerText += 'Z axis shake detected\n';
        } 
        document.getElementById('log').innerText += 'speed greater than threshold! ' + lastUpdate + ' ' + speed + '\n';      
        if (!shakeStarted) {
            shakeStarted = true;
            lastShakeTime = currentTime;
        } else {
            const directionChange = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

            if ((directionChange > 0 && !shakeDirectionChanged) || (directionChange < 0 && shakeDirectionChanged)) {
                shakeDirectionChanged = !shakeDirectionChanged;

                if (shakeDirectionChanged && (currentTime - lastShakeTime) < 300) {                    
                    isShaking = true;
                    rollBothDice();

                    shakeStarted = false;
                    shakeDirectionChanged = false;

                    clearTimeout(shakeTimeout);
                    shakeTimeout = setTimeout(() => {
                        isShaking = false;
                    }, 500);
                }
            }
        }
    } else if (currentTime - lastShakeTime > 300) {
        shakeStarted = false;
        shakeDirectionChanged = false;
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
    alert('DOMContentLoaded');
    document.getElementById('start').addEventListener('click', initializeMotionEvent);

  });

  async function checkPermissionStatus() {
    alert('checkPermissionStatus');
    try {
        const status = await navigator.permissions.query({ name: 'accelerometer' });
        alert(status.state);
        if (status.state === 'granted') {
            // Permission has already been granted
            window.addEventListener('devicemotion', deviceMotionHandler);
            return true;
        } else if (status.state === 'denied') {
            // Permission was denied, can't access devicemotion
            alert('Motion sensor access is denied.');
            return false;
        } else {
            // Permission is not yet requested or user decision is unknown
            // You might still need to request it interactively
            alert('Motion sensor permission is not granted. Please click the button to enable it.');
            return false;
        }
    } catch (error) {
        console.log('Permission check failed:', error);
    }
  }  
  // Add this script to your JavaScript file or in a <script> tag in the HTML
  document.querySelector('.overlay').addEventListener('click', async function() {
    alert("Touched: ");
    let permissioned = await checkPermissionStatus();
    alert("Permissioned: " + permissioned);
    if (!permissioned && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(permissionState => {
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', deviceMotionHandler);
            } else {
                alert('Device Motion permission denied.');
            }
        }).catch((error) =>
          {
            console.log("ERROR:" + error);
            alert("ERROR:" + error);
          }          
        );
    } else {
        window.addEventListener('devicemotion', deviceMotionHandler);
    }    
    this.classList.add('hidden');

  });