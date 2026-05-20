document.addEventListener('DOMContentLoaded', () => {
	// date
	const today = new Date();

	document.getElementById('date').innerText = today.toLocaleDateString("en-IN", {
		weekday: "short", day: "2-digit", month: "long", year: "numeric"
	});

	// elements
	const rollInput = document.getElementById('roll-input');
	const presentBtn = document.getElementById('roll-present');
	const absentBtn = document.getElementById('roll-absent');
	const submitBtn = document.getElementById('submitBox');
	const openCamBtn = document.getElementById('openCamBtn');
	const captureBtn = document.getElementById('captureBtn');
	const closeCamBtn = document.getElementById('closeCamBtn');
	const video = document.getElementById('videoFeed');
	const canvas = document.getElementById('snapCanvas');
	const attendanceBody = document.getElementById('attendanceBody');
	const cameraPlaceholder = document.getElementById('cameraPlaceholder');
	const captureFlash = document.getElementById('captureFlash');

	let camera = null;
	let selectedStatus = null;
	let lastCaptureDataUrl = null;
	let lastCapturedLocation = null;
	let locationDenied = false;


	function updateSelectedButtons() {
		presentBtn.classList.toggle('selected', selectedStatus === 'Present');
		absentBtn.classList.toggle('selected', selectedStatus === 'Absent');
	}

	presentBtn.addEventListener('click', () => {
		selectedStatus = 'Present';
		updateSelectedButtons();
		captureBtn.disabled = !camera;
	});

	absentBtn.addEventListener('click', () => {
		selectedStatus = 'Absent';
		updateSelectedButtons();
		captureBtn.disabled = true;
		lastCaptureDataUrl = null;
	});

	openCamBtn.addEventListener('click', async () => {
		if (camera) return;
		try {
			camera = await navigator.mediaDevices.getUserMedia({ video: true });
			video.srcObject = camera;
			await video.play();
			video.style.display = 'block';
			canvas.style.display = 'none';
			cameraPlaceholder.style.display = 'none';
			captureBtn.disabled = selectedStatus !== 'Present';
			closeCamBtn.disabled = false;
			openCamBtn.disabled = true;
		} catch (err) {
			alert('Could not open camera: ' + err.message);
		}
	});

	closeCamBtn.addEventListener('click', () => {
		if (camera) {
			camera.getTracks().forEach(t => t.stop());
			camera = null;
		}
		video.style.display = 'none';
		canvas.style.display = 'none';
		cameraPlaceholder.style.display = 'flex';
		captureBtn.disabled = true;
		closeCamBtn.disabled = true;
		openCamBtn.disabled = false;
	});

	captureBtn.addEventListener('click', () => {
		if (!camera || selectedStatus !== 'Present') return;
		const ctx = canvas.getContext('2d');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		canvas.style.display = 'block';
		video.style.display = 'none';
		lastCaptureDataUrl = canvas.toDataURL('image/png');

		if (captureFlash) {
			captureFlash.classList.add('flash');
			setTimeout(() => captureFlash.classList.remove('flash'), 300);
		}

		// Reset location state for this new capture attempt
		lastCapturedLocation = null;
		locationDenied = false;
		if (navigator.geolocation) {
			locationOverlay.classList.add('active');
			submitBtn.disabled = true;
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					lastCapturedLocation = {
						lat: pos.coords.latitude,
						lng: pos.coords.longitude
					};
					locationOverlay.classList.remove('active');
					submitBtn.disabled = false;
				},
				() => {
					lastCapturedLocation = null;
					locationDenied = true;
					locationOverlay.classList.remove('active');
					submitBtn.disabled = false;
				}
			);
		}
	});

	submitBtn.addEventListener('click', () => {
		const roll = (rollInput.value || '').trim();
		if (!roll) { alert('Please enter a roll number'); rollInput.focus(); return; }
		const status = selectedStatus || 'Absent';

		// Block submit if location was denied
		if (status === 'Present' && !lastCapturedLocation) {
			alert('Location access is required to submit attendance. Please allow location access and capture the photo again.');
			rollInput.value = '';
			selectedStatus = null;
			updateSelectedButtons();
			captureBtn.disabled = true;
			lastCaptureDataUrl = null;
			lastCapturedLocation = null;
			locationDenied = false;
			if (camera) { video.style.display = 'block'; canvas.style.display = 'none'; }
			return;
		}

		const locationUrl = (status === 'Present' && lastCapturedLocation)
			? `https://www.google.com/maps?q=${lastCapturedLocation.lat},${lastCapturedLocation.lng}`
			: null;

		fetch('http://localhost:3000/attendance', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ roll, status, locationUrl })
		})
			.then(res => res.json())
			.then(() => {
				loadTable();
			})
			.catch(() => alert('Failed to save attendance.'));

		// reset
		rollInput.value = '';
		selectedStatus = null;
		updateSelectedButtons();
		captureBtn.disabled = true;
		lastCaptureDataUrl = null;
		lastCapturedLocation = null;
		locationDenied = false;
		if (camera) { video.style.display = 'block'; canvas.style.display = 'none'; }
	});

	function loadTable() {
		fetch('http://localhost:3000/attendance')
			.then(res => res.json())
			.then(rows => {
				attendanceBody.innerHTML = '';
				rows.forEach(row => {
					const tr = document.createElement('tr');
					const tdRoll = document.createElement('td'); tdRoll.innerText = row.roll_number;
					const tdStatus = document.createElement('td'); tdStatus.innerText = row.status;
					const tdLocation = document.createElement('td');
					if (row.location_url) {
						const a = document.createElement('a');
						a.href = row.location_url;
						a.target = '_blank';
						a.rel = 'noopener noreferrer';
						a.innerText = 'View Location';
						a.className = 'location-link';
						tdLocation.appendChild(a);
					} else {
						tdLocation.innerText = '—';
						tdLocation.style.color = 'var(--slate)';
					}
					tr.appendChild(tdRoll);
					tr.appendChild(tdStatus);
					tr.appendChild(tdLocation);
					attendanceBody.appendChild(tr);
				});
			});
	}

	loadTable(); // load existing records on page open

	// initial state
	captureBtn.disabled = true;
	closeCamBtn.disabled = true;
});