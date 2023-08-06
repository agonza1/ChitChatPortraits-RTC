import VRMAvatar from "./VRMAvatar.js";
// get DOM elements
const iceConnectionLog = document.getElementById('ice-connection-state'),
    iceGatheringLog = document.getElementById('ice-gathering-state'),
    signalingLog = document.getElementById('signaling-state');

// peer connection
let pc = null;

// data channel
let dc = null, dcInterval = null;

// Instantiate the VRMAvatar class
const myVRM = new VRMAvatar();

function createPeerConnection() {
    const config = {
        sdpSemantics: 'unified-plan'
    };
    
    if (document.getElementById('use-stun').checked) {
        config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
    }
    
    const pc = new RTCPeerConnection(config);
    
    // register some listeners to help debugging
    pc.addEventListener('icegatheringstatechange', () => {
        iceGatheringLog.textContent += ` -> ${pc.iceGatheringState}`;
    }, false);
    iceGatheringLog.textContent = pc.iceGatheringState;
    
    pc.addEventListener('iceconnectionstatechange', () => {
        iceConnectionLog.textContent += ` -> ${pc.iceConnectionState}`;
    }, false);
    iceConnectionLog.textContent = pc.iceConnectionState;
    
    pc.addEventListener('signalingstatechange', () => {
        signalingLog.textContent += ` -> ${pc.signalingState}`;
    }, false);
    signalingLog.textContent = pc.signalingState;
    
    // connect audio / video
    pc.addEventListener('track', (evt) => {
        if (evt.track.kind === 'video') {
            document.getElementById('video').srcObject = evt.streams[0];
        } else {
            // Call the animate function to display avatar and start the animation with audio stream
            myVRM.animate();
            myVRM.initializeVoiceToAvatar(evt.streams[0]);
            document.getElementById('audio').srcObject = evt.streams[0];
        }
    });
    
    return pc;    
}

async function negotiate() {
    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait for ICE gathering to complete
        await new Promise((resolve) => {
            if (pc.iceGatheringState === 'complete') {
                resolve();
            } else {
                function checkState() {
                    if (pc.iceGatheringState === 'complete') {
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                }
                pc.addEventListener('icegatheringstatechange', checkState);
            }
        });

        const codec = document.getElementById('audio-codec').value;
        if (codec !== 'default') {
            offer.sdp = sdpFilterCodec('audio', codec, offer.sdp);
        }

        if (codec !== 'default') {
            offer.sdp = sdpFilterCodec('video', codec, offer.sdp);
        }

        document.getElementById('offer-sdp').textContent = offer.sdp;

        const response = await fetch('/offer', {
            body: JSON.stringify({
                sdp: offer.sdp,
                type: offer.type,
                video_transform: document.getElementById('video-transform').value
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });

        const answer = await response.json();
        document.getElementById('answer-sdp').textContent = answer.sdp;
        await pc.setRemoteDescription(answer);
    } catch (e) {
        alert(e);
    }
}


async function start() {
    document.getElementById('start').style.display = 'none';

    pc = createPeerConnection();

    let time_start = null;

    const current_stamp = () => {
        if (time_start === null) {
            time_start = new Date().getTime();
            return 0;
        } else {
            return new Date().getTime() - time_start;
        }
    };

    const constraints = {
        audio: document.getElementById('use-audio').checked,
        video: false
    };

    if (document.getElementById('use-video').checked) {
        const resolution = document.getElementById('video-resolution').value;
        if (resolution) {
            const [width, height] = resolution.split('x');
            constraints.video = {
                width: parseInt(width, 10),
                height: parseInt(height, 10)
            };
        } else {
            constraints.video = true;
        }
    }

    if (constraints.audio || constraints.video) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            await negotiate();
        } catch (err) {
            alert('Could not acquire media: ' + err);
        }
    } else {
        await negotiate();
    }

    document.getElementById('stop').style.display = 'inline-block';
}

async function stop() {
    document.getElementById('stop').style.display = 'none';

    // close data channel
    if (dc) {
        dc.close();
    }

    // close transceivers
    if (pc.getTransceivers) {
        pc.getTransceivers().forEach(transceiver => {
            if (transceiver.stop) {
                transceiver.stop();
            }
        });
    }

    // close local audio / video
    pc.getSenders().forEach(sender => {
        sender.track.stop();
    });

    // close peer connection
    await new Promise(resolve => setTimeout(resolve, 500));
    pc.close();
}

const sdpFilterCodec = (kind, codec, realSdp) => {
    var allowed = []
    var rtxRegex = new RegExp('a=fmtp:(\\d+) apt=(\\d+)\r$');
    var codecRegex = new RegExp('a=rtpmap:([0-9]+) ' + escapeRegExp(codec))
    var videoRegex = new RegExp('(m=' + kind + ' .*?)( ([0-9]+))*\\s*$')
    
    var lines = realSdp.split('\n');

    var isKind = false;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('m=' + kind + ' ')) {
            isKind = true;
        } else if (lines[i].startsWith('m=')) {
            isKind = false;
        }

        if (isKind) {
            var match = lines[i].match(codecRegex);
            if (match) {
                allowed.push(parseInt(match[1]));
            }

            match = lines[i].match(rtxRegex);
            if (match && allowed.includes(parseInt(match[2]))) {
                allowed.push(parseInt(match[1]));
            }
        }
    }

    var skipRegex = 'a=(fmtp|rtcp-fb|rtpmap):([0-9]+)';
    var sdp = '';

    isKind = false;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('m=' + kind + ' ')) {
            isKind = true;
        } else if (lines[i].startsWith('m=')) {
            isKind = false;
        }

        if (isKind) {
            var skipMatch = lines[i].match(skipRegex);
            if (skipMatch && !allowed.includes(parseInt(skipMatch[2]))) {
                continue;
            } else if (lines[i].match(videoRegex)) {
                sdp += lines[i].replace(videoRegex, '$1 ' + allowed.join(' ')) + '\n';
            } else {
                sdp += lines[i] + '\n';
            }
        } else {
            sdp += lines[i] + '\n';
        }
    }

    return sdp;
}

const vrmInterface = async () => {
    myVRM.interface();
}

const hideVrmInterface = async () => {
    myVRM.hideinterface();
}

const handleButtonClick = async (buttonId, action) => {
    const button = document.getElementById(buttonId);
    button.addEventListener("click", async () => {
        try {
          const result = await action();
        } catch (error) {
          console.error("An error occurred:", error);
        }
    });
};
handleButtonClick("start", start);
handleButtonClick("stop", stop);
handleButtonClick("interface", vrmInterface);
handleButtonClick("hideInterface", hideVrmInterface);

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}