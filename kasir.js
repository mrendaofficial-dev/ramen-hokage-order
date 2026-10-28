
const URL_API_KASIR =
    "https://script.google.com/macros/s/AKfycbwe_AcxOXB1EkrrEXxfuOCTB0hv-uasRdtr0Y1M9qgImLh5N5U2-CEQikgPExCOYYsEvw/exec";

let suaraAktif = false;
let audioContext = null;
let orderAwalSudahDibaca = false;
let daftarIDSebelumnya = new Set();
let pesananUntukCetak = [];
const KUNCI_CACHE_ORDER = "ramenHokageOrderCacheV1";

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


function tampilkanPesanan(pesanan) {
        pesananUntukCetak = pesanan;
    const daftar = document.getElementById("daftarPesanan");

    const tagihanAktif = pesanan.filter(function(order) {
        return statusPembayaran(order) !== "LUNAS";
    });

    const jumlahBaru = tagihanAktif.filter(function(order) {
        return String(order.statusOrder || "").trim().toUpperCase() === "BARU";
    }).length;

    const jumlahProses = tagihanAktif.filter(function(order) {
        return String(order.statusOrder || "").trim().toUpperCase() === "DIPROSES";
    }).length;

    const jumlahSelesai = tagihanAktif.filter(function(order) {
        return String(order.statusOrder || "").trim().toUpperCase() === "SELESAI";
    }).length;

    document.getElementById("jumlahBaru").textContent = jumlahBaru;
    document.getElementById("jumlahProses").textContent = jumlahProses;
    document.getElementById("jumlahSelesai").textContent = jumlahSelesai;

    if (tagihanAktif.length === 0) {
        daftar.innerHTML = "<p>Tidak ada tagihan aktif.</p>";
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

        return `
            <article class="order ${kelas}">
                <h3>${aman(nomor)}</h3>
                <p><b>Status pesanan:</b> ${aman(statusOrder || "-")}</p>
                <p><b>Status pembayaran:</b> ${aman(statusBayar)}</p>
                <p><b>Waktu order:</b> ${aman(order.waktu)}</p>
                <p><b>Nama:</b> ${aman(order.nama)}</p>
                <p><b>Lantai:</b> ${aman(order.lantai)}
                   · <b>Meja:</b> ${aman(order.meja)}</p>
                <p><b>Pesanan:</b><br>${aman(order.daftarPesanan || "-")}</p>
                <p class="catatan"><b>Catatan:</b> ${aman(order.catatan || "-")}</p>
                <p class="total">${rupiah(order.total)}</p>
                <p><b>Metode pembayaran:</b> ${aman(order.metodePembayaran || "-")}</p>
                
                <button type="button"
                    onclick="bukaFormPembayaran('${aman(nomor)}', ${Number(order.total) || 0})">
                    💳 PROSES PEMBAYARAN
                </button>

                <button type="button"
                    onclick="cetakTiket('${aman(nomor)}')">
                    🖨️ CETAK TIKET DAPUR
                </button>

            </article>
        `;
    }).join("");
}




async function cetakTiket(nomorOrder) {
    alert("TES CETAK: fungsi terbaru sudah berjalan");
    const order = pesananUntukCetak.find(function(item) {
        return String(item.nomorOrder) === String(nomorOrder);
    });

    if (!order) {
        alert("Data pesanan tidak ditemukan. Muat ulang dashboard.");
        return;
    }

    const tombol = Array.from(document.querySelectorAll("button"))
        .find(function(btn) {
            return btn.getAttribute("onclick") &&
                btn.getAttribute("onclick").includes("cetakTiket(") &&
                btn.getAttribute("onclick").includes(nomorOrder);
        });

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
            { type: "feed", lines: 3 }
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

        alert("Tiket berhasil dikirim ke printer.\nOrder: " +
            order.nomorOrder);

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
            tombol.textContent = "🖨️ CETAK TIKET DAPUR";
        }
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
    "https://script.google.com/macros/s/AKfycbwJXTsIfaj6ui_xtXuDA2iGlXVMJRrjO_k36rF4eeEmngVRQKOeR_CQZRpiu_F1A1dcbA/exec";

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
