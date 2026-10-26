
const URL_API_KASIR =
    "https://script.google.com/macros/s/AKfycbwe_AcxOXB1EkrrEXxfuOCTB0hv-uasRdtr0Y1M9qgImLh5N5U2-CEQikgPExCOYYsEvw/exec";

let suaraAktif = false;
let audioContext = null;
let orderAwalSudahDibaca = false;
let daftarIDSebelumnya = new Set();

function rupiah(nilai) {
    return "Rp" + Number(nilai || 0).toLocaleString("id-ID");
}

function aman(teks) {
    return String(teks ?? "").replace(/[&<>"']/g, function(huruf) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[huruf];
    });
}

async function aktifkanSuara() {
    try {
        const AudioCtx =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioCtx) {
            alert("Browser ini tidak mendukung bunyi otomatis.");
            return;
        }

        if (!audioContext) {
            audioContext = new AudioCtx();
        }

        await audioContext.resume();
        suaraAktif = true;

        document.getElementById("btnSuara").textContent =
            "🔔 SUARA AKTIF";

        bunyikanAlarm();
    } catch (error) {
        alert("Suara belum aktif. Silakan coba lagi.");
    }
}

function bunyikanAlarm() {
    if (!suaraAktif || !audioContext) return;

    [0, 0.25, 0.5].forEach(function(jeda) {
        const waktu = audioContext.currentTime + jeda;
        const osilator = audioContext.createOscillator();
        const volume = audioContext.createGain();

        osilator.frequency.value = 880;
        volume.gain.setValueAtTime(0.001, waktu);
        volume.gain.exponentialRampToValueAtTime(0.25, waktu + 0.03);
        volume.gain.exponentialRampToValueAtTime(0.001, waktu + 0.18);

        osilator.connect(volume);
        volume.connect(audioContext.destination);

        osilator.start(waktu);
        osilator.stop(waktu + 0.2);
    });
}

function normalisasiStatus(status) {
    const s = String(status || "").trim().toUpperCase();

    if (s === "SELESAI") return "selesai";
    if (s === "DIPROSES") return "proses";

    return "baru";
}

function tampilkanPesanan(pesanan) {
    const daftar = document.getElementById("daftarPesanan");

    let jumlahBaru = 0;
    let jumlahProses = 0;
    let jumlahSelesai = 0;

    pesanan.slice().reverse().forEach(function(order) {
        const status = normalisasiStatus(order.statusOrder);

        if (status === "baru") jumlahBaru++;
        if (status === "proses") jumlahProses++;
        if (status === "selesai") jumlahSelesai++;
    });

    document.getElementById("jumlahBaru").textContent = jumlahBaru;
    document.getElementById("jumlahProses").textContent = jumlahProses;
    document.getElementById("jumlahSelesai").textContent = jumlahSelesai;

    if (!pesanan.length) {
        daftar.innerHTML = "<p>Belum ada pesanan.</p>";
        return;
    }

    daftar.innerHTML = pesanan.slice().reverse().map(function(order) {
        const status = normalisasiStatus(order.statusOrder);

        return `
            <article class="order ${status}">
                <h3>${aman(order.nomorOrder)}</h3>
                <p><b>Status:</b> ${aman(order.statusOrder)}</p>
                <p><b>Waktu:</b> ${aman(order.waktu)}</p>
                <p><b>Nama:</b> ${aman(order.nama)}</p>
                <p><b>Lantai:</b> ${aman(order.lantai)}
                   · <b>Meja:</b> ${aman(order.meja)}</p>
                <p><b>Pesanan:</b><br>
                   ${aman(order.daftarPesanan || "-")}</p>
                <p class="catatan"><b>Catatan:</b>
                   ${aman(order.catatan || "-")}</p>
                <p class="total">${rupiah(order.total)}</p>
            </article>
        `;
    }).join("");
}

async function ambilPesanan(tampilkanPesan) {
    const statusEl = document.getElementById("statusKoneksi");

    try {
        const pemisah = URL_API_KASIR.includes("?") ? "&" : "?";
        const url = URL_API_KASIR + pemisah +
            "action=pesananKasir&t=" + Date.now();

        const response = await fetch(url, {
            method: "GET",
            redirect: "follow",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (data.status !== "success" || !Array.isArray(data.pesanan)) {
            throw new Error("Format data server tidak sesuai");
        }

        const pesanan = data.pesanan;
        const idSekarang = new Set(
            pesanan.map(function(order) {
                return String(order.nomorOrder);
            })
        );

        if (orderAwalSudahDibaca) {
            const adaOrderBaru = pesanan.some(function(order) {
                const id = String(order.nomorOrder);
                return !daftarIDSebelumnya.has(id);
            });

            if (adaOrderBaru) {
                bunyikanAlarm();
                statusEl.textContent =
                    "🔔 ORDER BARU TERDETEKSI — Periksa daftar pesanan";
            } else {
                statusEl.textContent =
                    "🟢 Terhubung · Pemeriksaan terakhir: " +
                    new Date().toLocaleTimeString("id-ID");
            }
        } else {
            orderAwalSudahDibaca = true;
            statusEl.textContent =
                "🟢 Terhubung · Menunggu order baru";
        }

        daftarIDSebelumnya = idSekarang;
        tampilkanPesanan(pesanan);

    } catch (error) {
        console.error("Gagal mengambil order kasir:", error);
        statusEl.textContent =
            "⚠️ Gagal membaca server. Periksa koneksi atau izin akses.";
    }
}

ambilPesanan(false);
setInterval(function() {
    ambilPesanan(false);
}, 7000);
