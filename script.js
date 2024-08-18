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
    //document.getElementById('log').innerText = 'Shaking detected Speed! '+ lastUpdate + ' ' + speed;
    if (speed > shakeThreshold && !isShaking) {
      document.getElementById('log').innerText += document.getElementById('log').innerText + '\n' + 'Shaking! '+ lastUpdate + ' ' + speed + '\n';
      isShaking = true;
      rollBothDice();
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

  async function checkPermissionStatus() {
    try {
        const status = await navigator.permissions.query({ name: 'accelerometer' });
        console.log(status.state);
        if (status.state === 'granted') {
            // Permission has already been granted
            window.addEventListener('devicemotion', deviceMotionHandler);
        } else if (status.state === 'denied') {
            // Permission was denied, can't access devicemotion
            alert('Motion sensor access is denied.');
        } else {
            // Permission is not yet requested or user decision is unknown
            // You might still need to request it interactively
            alert('Motion sensor permission is not granted. Please click the button to enable it.');
        }
    } catch (error) {
        console.log('Permission check failed:', error);
    }
  }  
  // Add this script to your JavaScript file or in a <script> tag in the HTML
  document.querySelector('.overlay').addEventListener('click', function() {

    checkPermissionStatus();
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(permissionState => {
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', deviceMotionHandler);
            }
        }).catch(console.error);
    } else {
        window.addEventListener('devicemotion', deviceMotionHandler);
    }    
    this.classList.add('hidden');

  });