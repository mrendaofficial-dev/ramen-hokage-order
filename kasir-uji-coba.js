
const URL_API_KASIR =
    "https://script.google.com/macros/s/AKfycbzDaeJJoowflT7tBoU1FURlrT7qYE7W0uPq0UDvr-YO2_SLESsIv_eVIyAtVNB1Lyh0/exec";

let suaraAktif = false;
let audioContext = null;
let orderAwalSudahDibaca = false;
let daftarIDSebelumnya = new Set();
let pesananUntukCetak = [];
const KUNCI_CACHE_ORDER = "ramenHokageOrderCacheUjiCobaV1";

function rupiah(nilai) {
    return "Rp" + Number(
        String(nilai || 0).replace(/[^\d-]/g, "")
    ).toLocaleString("id-ID");
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

function statusPembayaran(order) {
    const status = String(order.statusPembayaran || "")
        .trim()
        .toUpperCase();

    if (status === "LUNAS") return "LUNAS";
    if (status === "BELUM BAYAR") return "BELUM BAYAR";

    // Data lama yang belum memiliki status pembayaran
    return "BELUM DIVERIFIKASI";
}


// ==========================================
// REKAP PENJUALAN HARIAN
// ==========================================

function pastikanPanelRekapPenjualan() {

    let panel = document.getElementById("panelRekapPenjualan");

    if (panel) return panel;

    const daftar = document.getElementById("daftarPesanan");

    if (!daftar || !daftar.parentNode) return null;

    panel = document.createElement("section");

    panel.id = "panelRekapPenjualan";

    panel.style.cssText = `
        display:grid;
        grid-template-columns:2fr 1fr 1fr;
        gap:10px;
        margin:14px 0;
        padding:14px;
        border:1px solid #444;
        border-radius:12px;
        background:#171717;
        color:#fff;
        align-items:stretch;
    `;

    panel.innerHTML = `

        <div style="grid-column:1/-1;font-weight:700;font-size:16px;">
            💰 PENJUALAN HARI INI
            <span id="rekapTanggal"
                style="font-size:12px;font-weight:400;opacity:.7;">
            </span>
        </div>

        <div style="
            padding:12px;
            border-radius:9px;
            background:#242424;
            min-width:0;
        ">
            <div style="font-size:12px;opacity:.75;">
                TOTAL PENJUALAN
            </div>

            <div id="rekapTotal"
                style="font-size:25px;font-weight:800;color:#4ade80;">
                Memuat...
            </div>

            <div id="rekapJumlah"
                style="font-size:12px;opacity:.75;">
                Menghitung transaksi...
            </div>
        </div>

        <div style="
            padding:12px;
            border-radius:9px;
            background:#242424;
            min-width:0;
        ">
            <div style="font-size:13px;">
                💵 TUNAI
            </div>

            <div id="rekapTunai"
                style="font-size:19px;font-weight:700;">
                -
            </div>

            <div id="rekapJumlahTunai"
                style="font-size:12px;opacity:.7;">
                -
            </div>
        </div>

        <div style="
            padding:12px;
            border-radius:9px;
            background:#242424;
            min-width:0;
        ">
            <div style="font-size:13px;">
                📱 QRIS
            </div>

            <div id="rekapQris"
                style="font-size:19px;font-weight:700;">
                -
            </div>

            <div id="rekapJumlahQris"
                style="font-size:12px;opacity:.7;">
                -
            </div>
        </div>

        <div id="rekapStatus"
            style="grid-column:1/-1;font-size:11px;opacity:.65;">
            Menghubungkan ke server...
        </div>

    `;

    daftar.parentNode.insertBefore(panel, daftar);

    return panel;
}


async function ambilRekapPenjualanHarian() {
    const panel = pastikanPanelRekapPenjualan();
    if (!panel) return;

    const status = document.getElementById("rekapStatus");

    try {
        const response = await fetch(
            URL_API_KASIR + "?action=rekapPenjualanHarian&t=" + Date.now(),
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (data.status !== "success") {
            throw new Error(data.pesan || "Rekap tidak berhasil dibaca.");
        }

        document.getElementById("rekapTanggal").textContent =
            "· " + new Date(data.tanggal + "T00:00:00+07:00")
            .toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "Asia/Jakarta"
            });

        document.getElementById("rekapTotal").textContent =
            rupiah(data.totalPenjualan);

        document.getElementById("rekapJumlah").textContent =
            Number(data.jumlahTransaksi || 0) + " transaksi lunas";

        document.getElementById("rekapTunai").textContent =
            rupiah(data.totalTunai);

        document.getElementById("rekapJumlahTunai").textContent =
            Number(data.jumlahTunai || 0) + " transaksi";

        document.getElementById("rekapQris").textContent =
            rupiah(data.totalQris);

        document.getElementById("rekapJumlahQris").textContent =
            Number(data.jumlahQris || 0) + " transaksi";

        status.textContent =
            "Rekap dihitung dari pembayaran LUNAS hari ini · diperbarui " +
            new Date().toLocaleTimeString("id-ID");

    } catch (error) {
        console.error("Gagal mengambil rekap penjualan:", error);

        status.textContent =
            "⚠️ Rekap penjualan belum dapat diperbarui: " + error.message;
    }
}



function tampilkanPesanan(pesanan) {
    pesananUntukCetak = pesanan;

    const daftar = document.getElementById("daftarPesanan");

    // Order disembunyikan jika struk kasir sudah berhasil dicetak.
    const tagihanAktif = pesanan.filter(function(order) {
        const statusCetak = String(order.statusCetakKasir || "BELUM CETAK")
            .trim()
            .toUpperCase();

        return statusCetak !== "SUDAH CETAK";
    });

    const jumlahBaru = pesanan.filter(function(order) {
    return String(order.statusOrder || "").trim().toUpperCase() === "BARU";
}).length;

const jumlahProses = pesanan.filter(function(order) {
    return String(order.statusOrder || "").trim().toUpperCase() === "DIPROSES";
}).length;

const jumlahSelesai = pesanan.filter(function(order) {
    return String(order.statusOrder || "").trim().toUpperCase() === "SELESAI";
}).length;
    document.getElementById("jumlahBaru").textContent = jumlahBaru;
    document.getElementById("jumlahProses").textContent = jumlahProses;
    document.getElementById("jumlahSelesai").textContent = jumlahSelesai;

    if (tagihanAktif.length === 0) {
        daftar.innerHTML = "<p>Tidak ada order aktif.</p>";
        return;
    }

    daftar.innerHTML = tagihanAktif.slice().reverse().map(function(order) {
        const nomor = String(order.nomorOrder || "");
        const statusOrder = String(order.statusOrder || "").trim().toUpperCase();
        const statusBayar = statusPembayaran(order);

        const kelas = statusOrder === "DIPROSES"
            ? "proses"
            : statusOrder === "SELESAI"
                ? "selesai"
                : "baru";

        const tombolPembayaran = statusBayar === "LUNAS"
            ? ""
            : `<button type="button"
                onclick="bukaFormPembayaran('${aman(nomor)}', ${Number(order.total) || 0})">
                💳 PROSES PEMBAYARAN
            </button>`;

        return `
            <article class="order ${kelas}">
                <h3>${aman(nomor)}</h3>
                <p><b>Status pesanan:</b> ${aman(statusOrder || "-")}</p>
                <p><b>Status pembayaran:</b> ${aman(statusBayar)}</p>
                <p><b>Status cetak:</b> ${aman(order.statusCetakKasir || "BELUM CETAK")}</p>
                <p><b>Waktu order:</b> ${aman(order.waktu)}</p>
                <p><b>Nama:</b> ${aman(order.nama)}</p>
                <p><b>Lantai:</b> ${aman(order.lantai)}
                   · <b>Meja:</b> ${aman(order.meja)}</p>
                <p><b>Pesanan:</b><br>${aman(order.daftarPesanan || "-")}</p>
                <p class="catatan"><b>Catatan:</b> ${aman(order.catatan || "-")}</p>
                <p class="total">${rupiah(order.total)}</p>
                <p><b>Metode pembayaran:</b> ${aman(order.metodePembayaran || "-")}</p>

                <button type="button"
                    onclick="cetakTiket('${aman(nomor)}', this)">
                    🍜 PESANAN BUAT DAPUR
                </button>

                ${tombolPembayaran}

                ${statusBayar === "LUNAS" ? `
                <button type="button"
                    onclick="cetakStrukKasirCleanter('${aman(nomor)}', this)">
                    🧾 CETAK KASIR
                </button>
                ` : ""}
            </article>
        `;
    }).join("");
}


async function konfirmasiPesananDapur(nomorOrder) {
    await fetch(URL_API_KASIR, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "text/plain;charset=UTF-8"
        },
        body: JSON.stringify({
            action: "konfirmasiPesananDapur",
            nomorOrder: nomorOrder
        })
    });

    let berhasil = false;

    for (let i = 0; i < 8; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await fetch(
            URL_API_KASIR + "?action=pesananKasir&t=" + Date.now(),
            { cache: "no-store" }
        );

        const data = await response.json();

        const orderTerbaru = (data.pesanan || []).find(function(item) {
            return String(item.nomorOrder) === String(nomorOrder);
        });

        if (
            orderTerbaru &&
            String(orderTerbaru.statusOrder || "")
                .trim().toUpperCase() === "DIPROSES"
        ) {
            berhasil = true;
            break;
        }
    }

    if (!berhasil) {
        throw new Error(
            "Tiket mungkin sudah tercetak, tetapi status DIPROSES belum terverifikasi. Jangan cetak ulang dahulu."
        );
    }

    await ambilPesanan();
}



async function cetakTiket(nomorOrder, tombol) {
    const order = pesananUntukCetak.find(function(item) {
    return String(item.nomorOrder) === String(nomorOrder);
    });

    if (!order) {
        alert("Data pesanan tidak ditemukan. Muat ulang dashboard.");
        return;
    }

    if (tombol && tombol.disabled) return;

    if (tombol) {
        tombol.disabled = true;
        tombol.textContent = "MENGIRIM TIKET...";
    }

    const pengendali = new AbortController();
    const batasWaktu = setTimeout(function() {
        pengendali.abort();
    }, 45000);

    try {
        const content = [
            { type: "text", text: "RAMEN HOKAGE", align: "center", bold: true },
            { type: "text", text: "TIKET DAPUR", align: "center", bold: true },
            { type: "divider" },
            { type: "text", text: "Order: " + (order.nomorOrder || "-") },
            { type: "text", text: "Waktu: " + (order.waktu || "-") },
            { type: "text", text: "Nama: " + (order.nama || "-") },
            { type: "text", text: "Lantai: " + (order.lantai || "-") },
            { type: "text", text: "Meja: " + (order.meja || "-") },
            { type: "divider" },
            { type: "text", text: "DAFTAR PESANAN", bold: true }
        ];

        String(order.daftarPesanan || "-")
            .split(/\r?\n/)
            .forEach(function(baris) {
                content.push({
                    type: "text",
                    text: baris || " "
                });
            });

        content.push(
            { type: "divider" },
            { type: "text", text: "CATATAN:", bold: true },
            { type: "text", text: order.catatan || "-" },
            { type: "divider" },
            { type: "text", text: "MOHON DIPROSES", align: "center", bold: true },
        );

        const response = await fetch("http://localhost:9100/print", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                paperWidth: 58,
                cut: true,
                reference: String(order.nomorOrder || ""),
                content: content
            }),
            signal: pengendali.signal
        });

        const teksHasil = await response.text();
        let hasil = {};

        try {
            hasil = JSON.parse(teksHasil);
        } catch (e) {
            hasil = { detail: teksHasil };
        }

        if (!response.ok || hasil.status !== "printed") {
            throw new Error(
                hasil.fix ||
                hasil.detail ||
                hasil.error ||
                ("Respons Cleanter: HTTP " + response.status)
            );
        }

        await konfirmasiPesananDapur(nomorOrder);

alert(
    "TIKET DAPUR BERHASIL DICETAK!\n" +
    "Status pesanan: DIPROSES\n" +
    "Order: " + nomorOrder
);

    } catch (error) {
        console.error("Diagnostik cetak:", error);

        let pesan = error.name === "AbortError"
            ? "Permintaan cetak melewati batas waktu 45 detik."
            : (error.message || "Koneksi cetak gagal.");

        if (error.name !== "AbortError" &&
            error.message === "Failed to fetch") {
            try {
                const izin = await navigator.permissions.query({
                    name: "local-network-access"
                });

                pesan += "\nStatus izin akses perangkat: " + izin.state;
            } catch (e) {
                pesan += "\nStatus izin perangkat tidak dapat dibaca browser.";
            }

            pesan += "\nPeriksa apakah Cleanter masih berjalan.";
        }

        alert("TIKET BELUM TERCETAK\n\n" + pesan);

    } finally {
        clearTimeout(batasWaktu);

        if (tombol) {
            tombol.disabled = false;
            tombol.textContent = "🍜 PESANAN BUAT DAPUR";
        }
    }
}



async function cetakStrukKasirCleanter(nomorOrder, tombol) {

    const order = pesananUntukCetak.find(function(item) {
        return String(item.nomorOrder) === String(nomorOrder);
    });

    if (!order) {
        alert("Data pesanan tidak ditemukan.");
        return;
    }

    if (statusPembayaran(order) !== "LUNAS") {
        alert("Struk hanya dapat dicetak untuk pembayaran LUNAS.");
        return;
    }

    if (tombol && tombol.disabled) return;

    if (tombol) {
        tombol.disabled = true;
        tombol.textContent = "MENGIRIM STRUK...";
    }

    const pengendali = new AbortController();
    const batasWaktu = setTimeout(function() {
        pengendali.abort();
    }, 45000);

    try {
        

// MEMBACA RINCIAN MENU
let rincian = order.rincianPesanan;


// ==========================================
// KATALOG MENU AKTIF
// ==========================================

const katalogHargaAktif = {

    // LT1 MAKANAN
    "RAMEN BEEF KUAH KARI": 16000,
    "RAMEN BEEF KUAH ORI": 16000,
    "RAMEN SEAFOOD": 15000,
    "RAMEN KATSU KUAH KARI": 13000,
    "RAMEN KATSU KUAH ORI": 13000,
    "CHICKEN D STEAK": 23000,
    "MIE AYAM ORI": 10000,
    "MIE AYAM BASO": 15000,
    "BASO 100% DAGING SAPI": 13000,
    "KENTANG GORENG": 10000,
    "DIMSUM": 13000,
    "BASO TAHU": 12000,
    "ROTI KOPI/KEJU": 4000,
    "NASI GORENG BEEF": 16000,
    "NASI GORENG AYAM": 15000,
    "RICE BOWL BEEF": 16000,
    "CHICKEN KATSU": 17000,
    "MIX PLATER": 12000,
    "LAIN-LAIN": 1000,

    // LT1 MINUMAN
    "ES TEH MANIS": 4000,
    "TEH HANGAT MANIS": 3000,
    "AIR MINERAL": 4000,
    "LEMON TEA": 7000,
    "ES MILKY MATCHA": 12000,
    "ES KOPI CARAMEL MACHIATO": 12000,
    "ES KOPI AMERICANO": 12000,
    "ES KOPI BROWN SUGAR": 12000,
    "ES KOPI BUTTERSCOTH": 13000,

    // LT2 - TETAP DIPERTAHANKAN
    "Mie Gacoan Ori": 12000,
    "Mie Gacoan Pedas": 12000,
    "Baso Malang": 15000,
    "Mie Yamin": 15000,
    "Es Teh Tawar/Hangat": 2000,
    "Infuse Water": 3000,
    "Black Kopi": 10000

};


        if (!Array.isArray(rincian) || rincian.length === 0) {
    rincian = [];

    const daftar = String(order.daftarPesanan || "").trim();

    // Coba format JSON terlebih dahulu
    try {
        const hasil = JSON.parse(daftar);
        if (Array.isArray(hasil)) rincian = hasil;
    } catch (e) {}

    // Jika bukan JSON, baca format Nama Menu xJumlah
    if (rincian.length === 0) {
        daftar.split(/\s*,\s*/).forEach(function(baris) {
            const cocok = baris.match(/^(.+?)\s*x\s*(\d+)$/i);

            if (!cocok) return;

            const nama = cocok[1].trim();
            const jumlah = Number(cocok[2]);

            const namaKatalog = Object.keys(katalogHargaAktif).find(
                function(item) {
                    return item.toLowerCase() === nama.toLowerCase();
                }
            );

            if (!namaKatalog) {
                throw new Error("Harga menu tidak ditemukan: " + nama);
            }

            const harga = katalogHargaAktif[namaKatalog];

            rincian.push({
                nama: namaKatalog,
                harga: harga,
                jumlah: jumlah,
                subtotal: harga * jumlah
            });
        });
    }
}

if (!Array.isArray(rincian) || rincian.length === 0) {
    throw new Error("Rincian menu tidak berhasil dibaca.");
}

// MEMBANGUN ISI STRUK
const content = [
    { type: "text", text: "RAMEN HOKAGE", align: "center", bold: true },
    { type: "text", text: "STRUK PEMBAYARAN", align: "center", bold: true },
    { type: "divider" },
    { type: "text", text: "Order: " + (order.nomorOrder || "-") },
    { type: "text", text: "Waktu: " + (order.waktu || "-") },
    { type: "text", text: "Nama: " + (order.nama || "-") },
    { type: "text", text: "Lantai: " + (order.lantai || "-") },
    { type: "text", text: "Meja: " + (order.meja || "-") },
    { type: "divider" },
    { type: "text", text: "DAFTAR PESANAN", bold: true }
];

// Cetak rincian setiap menu
rincian.forEach(function(menu) {
    const harga = Number(menu.harga);
    const jumlah = Number(menu.jumlah);
    const subtotal = Number(menu.subtotal);

    if (!menu.nama || harga <= 0 || jumlah <= 0 ||
        subtotal !== harga * jumlah) {
        throw new Error("Rincian menu tidak valid: " + menu.nama);
    }

    // Nama menu di kiri dan subtotal item di kanan
    const namaMenuCetak = String(menu.nama);
    const hargaCetak = rupiah(subtotal).padStart(10, " ");

    if (namaMenuCetak.length <= 22) {
        content.push({
            type: "text",
            text: namaMenuCetak.padEnd(22, " ") + hargaCetak,
            bold: true
        });
    } else {
        content.push(
            { type: "text", text: namaMenuCetak, bold: true },
            { type: "text", text: hargaCetak, align: "right", bold: true }
        );
    }

    content.push({
        type: "text",
        text: jumlah + " x " + rupiah(harga)
    });
});

// PEMBAYARAN
const catatanBayar = String(order.catatanPembayaran || "");
const uangMatch = catatanBayar.match(/Uang diterima:\s*Rp([\d.]+)/i);
const kembaliMatch = catatanBayar.match(/kembalian:\s*Rp([\d.]+)/i);

content.push(
    { type: "divider" },
    { type: "text", text: "TOTAL: " + rupiah(order.total), bold: true }
);

if (uangMatch) {
    content.push({
        type: "text",
        text: "Uang diterima: Rp" + uangMatch[1]
    });
}

if (kembaliMatch) {
    content.push({
        type: "text",
        text: "Kembalian: Rp" + kembaliMatch[1]
    });
}

content.push(
    { type: "text", text: "Metode: " + (order.metodePembayaran || "-") },
    { type: "text", text: "STATUS: LUNAS", bold: true },
    { type: "divider" },
    { type: "text", text: "TERIMA KASIH", align: "center", bold: true },
);

        const response = await fetch("http://localhost:9100/print", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                paperWidth: 58,
                cut: true,
                reference: String(order.nomorOrder || ""),
                content: content
            }),
            signal: pengendali.signal
        });

        const teksHasil = await response.text();
        let hasil = {};

        try {
            hasil = JSON.parse(teksHasil);
        } catch (e) {
            hasil = { detail: teksHasil };
        }

        if (!response.ok || hasil.status !== "printed") {
            throw new Error(
                hasil.fix ||
                hasil.detail ||
                hasil.error ||
                ("Respons Cleanter: HTTP " + response.status)
            );
        }

        const yakin = confirm(
            "Cleanter melaporkan proses cetak berhasil.\n\n" +
            "Apakah struk benar-benar sudah keluar dari printer?"
        );

        if (yakin) {
            await konfirmasiCetakKasir(nomorOrder);
        } else {
            alert(
                "Status cetak belum dikonfirmasi.\n" +
                "Periksa printer sebelum mencoba mencetak kembali."
            );
        }

    } catch (error) {
        console.error("Diagnostik cetak struk kasir:", error);

        const pesan = error.name === "AbortError"
            ? "Permintaan cetak melewati batas waktu 45 detik."
            : error.message || "Koneksi Cleanter gagal.";

        alert("STRUK BELUM TERCETAK\n\n" + pesan);

    } finally {
        clearTimeout(batasWaktu);

        if (tombol) {
            tombol.disabled = false;
            tombol.textContent = "🧾 CETAK KASIR";
        }
    }
}


async function konfirmasiCetakKasir(nomorOrder) {
    try {
        await fetch(URL_API_KASIR, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=UTF-8"
            },
            body: JSON.stringify({
                action: "konfirmasiCetakKasir",
                nomorOrder: nomorOrder
            })
        });

        let sudahTercatat = false;

        for (let i = 0; i < 8; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = await fetch(
                URL_API_KASIR +
                "?action=pesananKasir&t=" + Date.now(),
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            const data = await response.json();

            if (
                data.status !== "success" ||
                !Array.isArray(data.pesanan)
            ) {
                continue;
            }

            const terbaru = data.pesanan.find(function(item) {
                return String(item.nomorOrder) === String(nomorOrder);
            });

            if (
    terbaru &&
    String(terbaru.statusCetakKasir || "")
        .trim()
        .toUpperCase() === "SUDAH CETAK" &&
    String(terbaru.statusOrder || "")
        .trim()
        .toUpperCase() === "SELESAI"
) {
                sudahTercatat = true;
                break;
            }
        }

        if (sudahTercatat) {
            alert(
                "STRUK BERHASIL DICETAK DAN TERCATAT!\n" +
                "Order: " + nomorOrder
            );

            await ambilPesanan();

        } else {
            alert(
                "Konfirmasi belum tercatat di Google Sheets.\n\n" +
                "Periksa kolom O pada sheet ORDER. " +
                "Jangan mencetak ulang dahulu."
            );
        }

    } catch (error) {
        console.error("Konfirmasi cetak gagal:", error);

        alert(
            "Gagal memverifikasi status cetak.\n\n" +
            "Periksa Google Sheets sebelum mengulang proses."
        );
    }
}

function bukaFormPembayaran(nomorOrder, total) {
    const pilihan = prompt(
        "Pembayaran order " + nomorOrder +
        "\nTagihan: " + rupiah(total) +
        "\n\nKetik TUNAI atau QRIS:"
    );

    if (!pilihan) return;

    const metode = pilihan.trim().toUpperCase();

    if (metode !== "TUNAI" && metode !== "QRIS") {
        alert("Pilih TUNAI atau QRIS.");
        return;
    }

    let uangDibayar = 0;

    if (metode === "TUNAI") {
        const masukan = prompt(
            "Tagihan: " + rupiah(total) +
            "\nMasukkan uang yang diterima:"
        );

        if (masukan === null) return;

        uangDibayar = Number(masukan.replace(/[^\d]/g, ""));

        if (!Number.isFinite(uangDibayar) || uangDibayar < total) {
            alert("Uang yang diterima kurang dari tagihan atau tidak valid.");
            return;
        }

        alert(
            "Tagihan: " + rupiah(total) +
            "\nUang diterima: " + rupiah(uangDibayar) +
            "\nKembalian: " + rupiah(uangDibayar - total)
        );
    } else {
        const yakin = confirm(
            "Pastikan pembayaran QRIS sudah masuk melalui sistem QRIS kawan.\n\n" +
            "Apakah pembayaran sudah terverifikasi?"
        );

        if (!yakin) return;
    }

    const petugas = prompt("Nama petugas kasir:", "Kasir");

    if (petugas === null || !petugas.trim()) return;

    const lanjut = confirm(
        "Konfirmasi pembayaran order " + nomorOrder +
        " dengan metode " + metode + "?"
    );

    if (!lanjut) return;

    prosesPembayaran({
        nomorOrder: nomorOrder,
        metode: metode,
        petugas: petugas.trim(),
        uangDibayar: uangDibayar
    });
}

async function prosesPembayaran(dataPembayaran) {
    try {
        const hasil = await kirimKonfirmasiPembayaran(dataPembayaran);

        alert(
            "Pembayaran terverifikasi!\n" +
            "Order: " + hasil.nomorOrder +
            "\nMetode: " + hasil.metodePembayaran
        );

        await ambilPesanan();
    } catch (error) {
        alert(
            "Pembayaran belum terverifikasi.\n" +
            error.message +
            "\nPeriksa Google Sheets sebelum mencoba kembali."
        );
    }
}

    
async function ambilPesanan() {
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

// Perbarui status pembayaran dari server pembayaran.
await Promise.all(
    pesanan
        .filter(order => statusPembayaran(order) !== "LUNAS")
        .map(async function(order) {
            try {
                const terbaru = await cekStatusPembayaran(
                    order.nomorOrder
                );

                if (terbaru.statusPembayaran) {
                    order.statusPembayaran =
                        String(terbaru.statusPembayaran)
                            .trim()
                            .toUpperCase();

                    order.metodePembayaran =
                        terbaru.metodePembayaran || "";
                }
            } catch (error) {
                // Jika pemeriksaan gagal, gunakan status yang tersedia.
            }
        })
);

try {
    localStorage.setItem(
        KUNCI_CACHE_ORDER,
        JSON.stringify(pesanan)
    );
} catch (error) {
    console.warn(
        "Order belum dapat disimpan di perangkat:",
        error
    );
}

        const idSekarang = new Set(
            pesanan.map(function(order) {
                return String(order.nomorOrder);
            })
        );

        if (orderAwalSudahDibaca) {
            const adaOrderBaru = pesanan.some(function(order) {
                return !daftarIDSebelumnya.has(String(order.nomorOrder));
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
        await ambilRekapPenjualanHarian();

    
} catch (error) {
    console.error("Gagal mengambil order kasir:", error);

    let cacheTersedia = false;

    try {
        const cache = localStorage.getItem(KUNCI_CACHE_ORDER);

        if (cache) {
            const pesananTersimpan = JSON.parse(cache);

            if (Array.isArray(pesananTersimpan)) {
                tampilkanPesanan(pesananTersimpan);
                cacheTersedia = true;
            }
        }
    } catch (errorCache) {
        console.error("Gagal membaca cache order:", errorCache);
    }

    
    statusEl.textContent = cacheTersedia
        ? "⚠️ Internet terputus — menampilkan order tersimpan di tablet."
        : "⚠️ Server tidak dapat diakses dan belum ada order tersimpan.";
    }
}

ambilPesanan();

setInterval(function() {
    ambilPesanan();
}, 7000);


const URL_API_PEMBAYARAN =
    "https://script.google.com/macros/s/AKfycbzDaeJJoowflT7tBoU1FURlrT7qYE7W0uPq0UDvr-YO2_SLESsIv_eVIyAtVNB1Lyh0/exec";
async function cekStatusPembayaran(nomorOrder) {
    const url = URL_API_PEMBAYARAN +
        "?action=statusPembayaran&nomorOrder=" +
        encodeURIComponent(nomorOrder) +
        "&t=" + Date.now();

    const response = await fetch(url, {
        method: "GET",
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error("Gagal membaca status pembayaran.");
    }

    const data = await response.json();

    if (data.status !== "success") {
        throw new Error(data.pesan || "Status pembayaran tidak ditemukan.");
    }

    return data;
}


async function kirimKonfirmasiPembayaran(dataPembayaran) {
    const url = URL_API_PEMBAYARAN;

    // Kirim permintaan tanpa mengandalkan respons POST.
    // Status akhir wajib dibaca kembali dari Google Sheets.
    try {
        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=UTF-8"
            },
            body: JSON.stringify({
                action: "konfirmasiPembayaran",
                nomorOrder: dataPembayaran.nomorOrder,
                metode: dataPembayaran.metode,
                petugas: dataPembayaran.petugas || "Kasir",
                uangDibayar: dataPembayaran.uangDibayar || 0
            })
        });
    } catch (error) {
        throw new Error(
            "Permintaan tidak dapat dikirim. Status pembayaran belum dapat dipastikan."
        );
    }

    // Verifikasi ulang melalui endpoint baca status.
    // Jangan menyatakan berhasil hanya karena POST terkirim.
    for (let percobaan = 0; percobaan < 6; percobaan++) {
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const hasil = await cekStatusPembayaran(
                dataPembayaran.nomorOrder
            );

            if (
                String(hasil.statusPembayaran || "").toUpperCase() === "LUNAS" &&
                String(hasil.metodePembayaran || "").toUpperCase() ===
                    String(dataPembayaran.metode).toUpperCase()
            ) {
                return hasil;
            }
        } catch (error) {
            // Coba membaca ulang pada putaran berikutnya.
        }
    }

    throw new Error(
        "Status LUNAS belum terverifikasi. Periksa Google Sheets sebelum mencoba lagi."
    );
}


async function tesServerCleanter() {
    const controller = new AbortController();
    const timer = setTimeout(function() {
        controller.abort();
    }, 3000);

    alert("Tes koneksi Cleanter dimulai. Tunggu hasilnya.");

    try {
        const response = await fetch(
            "http://localhost:9100/health",
            {
                method: "GET",
                signal: controller.signal
            }
        );

        const hasil = await response.text();

        alert(
            "SERVER MEMBERI RESPONS\n" +
            "HTTP: " + response.status + "\n" +
            "Isi respons: " + (hasil || "(kosong)")
        );
    } catch (error) {
        if (error.name === "AbortError") {
            alert(
                "TES WAKTU HABIS: 3 DETIK\n" +
                "Server tidak memberi respons tepat waktu."
            );
        } else {
            alert(
                "TES KONEKSI GAGAL\n" +
                "Jenis: " + error.name + "\n" +
                "Pesan: " + error.message
            );
        }
    } finally {
        clearTimeout(timer);
    }
}

// ==========================================
// KONTROL BUKA / TUTUP KEDAI RAMEN HOKAGE
// ==========================================

const KUNCI_TOKEN_KASIR = "ramenHokageTokenKasir";

function buatTokenKasirDashboard() {
    if (!window.crypto || !window.crypto.randomUUID) {
        throw new Error("Browser tidak mendukung pembuatan token aman.");
    }

    return window.crypto.randomUUID();
}

function ambilTokenKasirDashboard() {
    let token = localStorage.getItem(KUNCI_TOKEN_KASIR);

    // Memindahkan token lama jika masih tersimpan di sessionStorage
    if (!token) {
        token = sessionStorage.getItem(KUNCI_TOKEN_KASIR);
    }

    if (!token) {
        token = buatTokenKasirDashboard();
    }

    localStorage.setItem(KUNCI_TOKEN_KASIR, token);

    return token;
}
async function kirimPerintahKedai(data) {
    await fetch(URL_API_KASIR, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "text/plain;charset=UTF-8"
        },
        body: JSON.stringify(data)
    });
}

async function bacaStatusKedaiDashboard() {
    const response = await fetch(
        URL_API_KASIR + "?action=statusKedai&t=" + Date.now(),
        { cache: "no-store" }
    );

    if (!response.ok) {
        throw new Error("Gagal membaca status kedai.");
    }

    return await response.json();
}

async function ambilKodeAksesDashboard(token) {
    const response = await fetch(
        URL_API_KASIR +
        "?action=aksesKasir&token=" +
        encodeURIComponent(token) +
        "&t=" + Date.now(),
        { cache: "no-store" }
    );

    if (!response.ok) {
        throw new Error("Gagal memeriksa akses kasir.");
    }

    return await response.json();
}

function tampilkanStatusKedaiDashboard(aktif) {
    const status = document.getElementById("statusKedaiDashboard");
    const tombolBuka = document.getElementById("btnBukaKedai");
    const tombolTutup = document.getElementById("btnTutupKedai");

    if (aktif) {
        status.textContent = "🟢 KEDAI SEDANG BUKA";
        tombolBuka.disabled = true;
        tombolTutup.disabled = false;
    } else {
        status.textContent = "🔴 KEDAI SEDANG TUTUP";
        tombolBuka.disabled = false;
        tombolTutup.disabled = true;

        document.getElementById("tampilanKodeAkses").style.display = "none";
        document.getElementById("kodeAksesPelanggan").textContent = "----";
    }
}

async function cekStatusAwalKedai() {
    try {
        const data = await bacaStatusKedaiDashboard();

        if (data.status !== "success") {
            throw new Error("Respons status kedai tidak valid.");
        }

        tampilkanStatusKedaiDashboard(data.kedaiAktif);

        if (data.kedaiAktif) {
            const token =
    localStorage.getItem(KUNCI_TOKEN_KASIR) ||
    sessionStorage.getItem(KUNCI_TOKEN_KASIR);

            if (token) {
                const akses = await ambilKodeAksesDashboard(token);

                if (akses.status === "success") {
                    document.getElementById("kodeAksesPelanggan").textContent =
                        akses.kodeAkses;

                    document.getElementById("tampilanKodeAkses").style.display =
                        "block";
                }
            }
        }
    } catch (error) {
        console.error("Pemeriksaan status kedai gagal:", error);
        document.getElementById("statusKedaiDashboard").textContent =
            "⚠️ Gagal menghubungi server kedai.";
    }
}

async function bukaKedaiDashboard() {
    const inputPin = document.getElementById("pinKasirDashboard");
    const pin = inputPin.value.trim();

    if (!/^\d{6}$/.test(pin)) {
        alert("Masukkan PIN Kasir 6 digit.");
        return;
    }

    const tombol = document.getElementById("btnBukaKedai");

    try {
        tombol.disabled = true;
        tombol.textContent = "MEMBUKA KEDAI...";

        const token = ambilTokenKasirDashboard();

        await kirimPerintahKedai({
            action: "bukaKedai",
            pin: pin,
            tokenKasir: token
        });

        let akses = null;

        // Verifikasi hasil POST melalui endpoint GET.
        for (let i = 0; i < 8; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));

            try {
                akses = await ambilKodeAksesDashboard(token);

                if (
                    akses.status === "success" &&
                    /^\d{4}$/.test(akses.kodeAkses)
                ) {
                    break;
                }
            } catch (error) {
                // Coba ulang membaca hasil.
            }
        }

        inputPin.value = "";

        if (!akses || akses.status !== "success" ||
            !/^\d{4}$/.test(akses.kodeAkses)) {
            localStorage.removeItem(KUNCI_TOKEN_KASIR);
sessionStorage.removeItem(KUNCI_TOKEN_KASIR);
            throw new Error(
                "Kedai belum berhasil dibuka. Periksa PIN atau koneksi server."
            );
        }

        document.getElementById("kodeAksesPelanggan").textContent =
            akses.kodeAkses;

        document.getElementById("tampilanKodeAkses").style.display = "block";

        tampilkanStatusKedaiDashboard(true);

        alert("Kedai berhasil dibuka!\nKode akses: " + akses.kodeAkses);

    } catch (error) {
        console.error("Buka kedai gagal:", error);
        alert(error.message);
        await cekStatusAwalKedai();

    } finally {
        tombol.textContent = "🔓 BUKA KEDAI";
        await cekStatusAwalKedai();
    }
}

async function tutupKedaiDashboard() {
    const inputPin = document.getElementById("pinKasirDashboard");
    const pin = inputPin.value.trim();

    if (!/^\d{6}$/.test(pin)) {
        alert("Masukkan PIN Kasir 6 digit.");
        return;
    }

    if (!confirm("Yakin ingin menutup kedai dan menonaktifkan kode akses?")) {
        return;
    }

    const tombol = document.getElementById("btnTutupKedai");

    try {
        tombol.disabled = true;
        tombol.textContent = "MENUTUP KEDAI...";

        const token =
    localStorage.getItem(KUNCI_TOKEN_KASIR) ||
    sessionStorage.getItem(KUNCI_TOKEN_KASIR) ||
    "";

        await kirimPerintahKedai({
            action: "tutupKedai",
            pin: pin,
            tokenKasir: token
        });

        let status = null;

        for (let i = 0; i < 8; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));

            try {
                status = await bacaStatusKedaiDashboard();

                if (status.status === "success" &&
                    status.kedaiAktif === false) {
                    break;
                }
            } catch (error) {
                // Coba ulang membaca status.
            }
        }

        inputPin.value = "";

        if (!status || status.kedaiAktif !== false) {
            throw new Error("Status tutup kedai belum dapat diverifikasi.");
        }

        localStorage.removeItem(KUNCI_TOKEN_KASIR);
sessionStorage.removeItem(KUNCI_TOKEN_KASIR);

        tampilkanStatusKedaiDashboard(false);

        alert("Kedai berhasil ditutup. Kode akses sudah dinonaktifkan.");

    } catch (error) {
        console.error("Tutup kedai gagal:", error);
        alert(error.message);

    } finally {
        tombol.textContent = "🔒 TUTUP KEDAI";
        await cekStatusAwalKedai();
    }
}

// Periksa status kedai saat dashboard dibuka.
cekStatusAwalKedai();

// ==========================================
// PANEL PENGATURAN KETERSEDIAAN MENU - LT1
// ==========================================

let daftarStatusMenuDashboard = [];
let prosesUbahStatusMenu = false;
let nomorCallbackStatusMenu = 0;


// Membaca status menu melalui JSONP
function bacaStatusMenuDashboard() {
    return new Promise(function(resolve, reject) {
        const callback =
            "callbackStatusMenuHokage" + (++nomorCallbackStatusMenu);

        const script = document.createElement("script");

        const batasWaktu = setTimeout(function() {
            delete window[callback];
            script.remove();
            reject(new Error("Waktu membaca status menu habis."));
        }, 15000);

        window[callback] = function(hasil) {
            clearTimeout(batasWaktu);
            delete window[callback];
            script.remove();

            if (
                !hasil ||
                hasil.status !== "success" ||
                !Array.isArray(hasil.menu)
            ) {
                reject(new Error("Data status menu tidak valid."));
                return;
            }

            resolve(hasil.menu);
        };

        script.onerror = function() {
            clearTimeout(batasWaktu);
            delete window[callback];
            script.remove();
            reject(new Error("Gagal menghubungi server status menu."));
        };

        script.src =
            URL_API_KASIR +
            "?action=statusMenu&callback=" +
            callback +
            "&t=" + Date.now();

        document.body.appendChild(script);
    });
}


// Membuat panel pengaturan menu
function pastikanPanelStatusMenu() {
    let panel = document.getElementById("panelStatusMenu");

    if (panel) return panel;

    const daftar = document.getElementById("daftarPesanan");

    if (!daftar || !daftar.parentNode) return null;

    panel = document.createElement("section");
    panel.id = "panelStatusMenu";

    panel.style.cssText = `
        margin:14px 0;
        padding:14px;
        border:1px solid #555;
        border-radius:12px;
        background:#171717;
        color:white;
    `;

    panel.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:10px;
        ">
            <strong style="font-size:16px;">
                🍜 KETERSEDIAAN MENU LT1
            </strong>

            <button
                type="button"
                id="btnRefreshStatusMenu"
                style="padding:8px 12px;">
                🔄 MUAT ULANG
            </button>
        </div>

        <p id="statusInfoMenu"
            style="font-size:12px;opacity:.75;">
            Menghubungkan ke server...
        </p>

        <div id="daftarStatusMenu"
            style="
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
                gap:8px;
            ">
        </div>
    `;

    daftar.parentNode.insertBefore(panel, daftar);

    document.getElementById("btnRefreshStatusMenu")
        .addEventListener("click", ambilStatusMenuDashboard);

    return panel;
}


// Menampilkan daftar menu dan statusnya
function tampilkanStatusMenuDashboard() {
    const daftar = document.getElementById("daftarStatusMenu");

    if (!daftar) return;

    daftar.innerHTML = daftarStatusMenuDashboard.map(function(menu) {
        const habis = menu.status === "HABIS";

        const warna = habis ? "#7f1d1d" : "#14532d";
        const tulisan = habis ? "🔴 HABIS" : "🟢 TERSEDIA";
        const tujuan = habis ? "TERSEDIA" : "HABIS";

        return `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:8px;
                padding:10px;
                border-radius:8px;
                background:#242424;
                border:1px solid #444;
            ">
                <span style="
                    font-size:12px;
                    font-weight:600;
                    flex:1;
                ">
                    ${aman(menu.nama)}
                </span>

                <button
                    type="button"
                    data-nama-menu="${aman(menu.nama)}"
                    data-status-baru="${tujuan}"
                    style="
                        padding:8px;
                        border:0;
                        border-radius:6px;
                        background:${warna};
                        color:white;
                        font-size:11px;
                        font-weight:bold;
                        cursor:pointer;
                        white-space:nowrap;
                    ">
                    ${tulisan}
                </button>
            </div>
        `;
    }).join("");

    daftar.querySelectorAll("button[data-nama-menu]")
        .forEach(function(tombol) {
            tombol.addEventListener("click", function() {
                ubahStatusMenuDashboard(
                    tombol.dataset.namaMenu,
                    tombol.dataset.statusBaru,
                    tombol
                );
            });
        });
}


// Mengambil daftar status dari CORE
async function ambilStatusMenuDashboard() {
    const panel = pastikanPanelStatusMenu();

    if (!panel) return;

    const info = document.getElementById("statusInfoMenu");
    const tombolRefresh = document.getElementById("btnRefreshStatusMenu");

    if (tombolRefresh) tombolRefresh.disabled = true;

    info.textContent = "Mengambil data menu...";

    try {
        daftarStatusMenuDashboard =
            await bacaStatusMenuDashboard();

        tampilkanStatusMenuDashboard();

        info.textContent =
            "🟢 " + daftarStatusMenuDashboard.length +
            " menu LT1 · Diperbarui " +
            new Date().toLocaleTimeString("id-ID");

    } catch (error) {
        console.error("Status menu gagal dibaca:", error);
        info.textContent = "⚠️ " + error.message;

    } finally {
        if (tombolRefresh) tombolRefresh.disabled = false;
    }
}


// Mengubah status menu melalui BACKUP CORE
async function ubahStatusMenuDashboard(namaMenu, statusBaru, tombol) {

    if (prosesUbahStatusMenu) return;

    const token = localStorage.getItem("ramenHokageTokenKasir");

    if (!token) {
        alert("Token sesi kasir tidak ditemukan. Periksa sesi kasir.");
        return;
    }

    const namaPetugas = prompt("Nama petugas kasir:", "Kasir");

    if (namaPetugas === null || !namaPetugas.trim()) return;

    const yakin = confirm(
        "Ubah status menu:\n\n" +
        namaMenu + "\n\n" +
        "Menjadi: " + statusBaru + "?"
    );

    if (!yakin) return;

    prosesUbahStatusMenu = true;

    tombol.disabled = true;
    tombol.textContent = "MENYIMPAN...";

    document.getElementById("statusInfoMenu").textContent =
        "Menyimpan perubahan ke server...";

    try {
        await fetch(URL_API_KASIR, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=UTF-8"
            },
            body: JSON.stringify({
                action: "ubahStatusMenu",
                tokenKasir: token,
                namaMenu: namaMenu,
                status: statusBaru,
                petugas: namaPetugas.trim()
            })
        });

        // POST no-cors tidak dapat membaca respons server.
        // Karena itu, verifikasi dilakukan dengan membaca ulang status.
        let berhasil = false;

        for (let i = 0; i < 8; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const hasil = await bacaStatusMenuDashboard();

            const menuTerbaru = hasil.find(function(menu) {
                return menu.nama === namaMenu;
            });

            if (menuTerbaru && menuTerbaru.status === statusBaru) {
                daftarStatusMenuDashboard = hasil;
                berhasil = true;
                break;
            }
        }

        if (!berhasil) {
            throw new Error(
                "Perubahan belum terverifikasi. Periksa Google Sheets."
            );
        }

        tampilkanStatusMenuDashboard();

        document.getElementById("statusInfoMenu").textContent =
            "🟢 Status " + namaMenu +
            " berhasil diubah menjadi " + statusBaru;

        alert(
            "PERUBAHAN BERHASIL!\n\n" +
            namaMenu + "\n" +
            "Status: " + statusBaru
        );

    } catch (error) {
        console.error("Perubahan status menu gagal:", error);

        alert(
            "STATUS MENU BELUM DAPAT DIPASTIKAN.\n\n" +
            error.message
        );

        await ambilStatusMenuDashboard();

    } finally {
        prosesUbahStatusMenu = false;
    }
}


// Jalankan panel saat dashboard dibuka
ambilStatusMenuDashboard();
