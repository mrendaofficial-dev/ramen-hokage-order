const URL_API =
    "https://script.google.com/macros/s/AKfycbwe_AcxOXB1EkrrEXxfuOCTB0hv-uasRdtr0Y1M9qgImLh5N5U2-CEQikgPExCOYYsEvw/exec";


const menuLt1 = [
    {
        nama: "Ramen Beef",
        harga: 16000
    },

    {
        nama: "Ramen Katsu",
        harga: 13000
    },

    {
        nama: "Mie Ayam",
        harga: 10000
    },

    {
        nama: "Mie Ayam Baso",
        harga: 15000
    },

    {
        nama: "Baso Sapi 100%",
        harga: 13000
    },

    {
    nama: "Chicken Double Steak",
    harga: 20000
    },

    {
        nama: "Roti Kopi/Manis",
        harga: 4000
    },

    {
        nama: "Dimsum",
        harga: 13000
    },

    {
        nama: "Kentang Goreng",
        harga: 10000
    },

    {
        nama: "Es Teh Manis/Hangat Manis",
        harga: 4000
    },

    {
        nama: "Es Lemon Tea",
        harga: 5000
    },

    {
        nama: "Teh Hangat Tawar",
        harga: 2000
    },

    {
        nama: "Air Mineral",
        harga: 4000
    }
];


const menuLt2 = [
    {
        nama: "Mie Gacoan Ori",
        harga: 12000
    },

    {
        nama: "Mie Gacoan Pedas",
        harga: 12000
    },

    {
        nama: "Baso Malang",
        harga: 15000
    },

    {
        nama: "Mie Yamin",
        harga: 15000
    },

    {
        nama: "Es Teh Manis",
        harga: 4000
    },

    {
        nama: "Es Teh Tawar/Hangat",
        harga: 2000
    },

    {
        nama: "Infuse Water",
        harga: 3000
    },

    {
        nama: "Air Mineral",
        harga: 4000
    },

    {
        nama: "Black Kopi",
        harga: 10000
    }
];


let jumlahMenuLt2 = [
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
];


let dataNama = "";

let dataMeja = "";

let dataCatatan = "";

let lantaiPelanggan = "";

let modeOrder = "KUNCI_LANTAI";


function cekModeOrder() {

    if (modeOrder === "KUNCI_LANTAI") {

        return "KUNCI_LANTAI";

    }

    if (modeOrder === "GABUNGAN") {

        return "GABUNGAN";

    }

}


function pilihLantai() {

    document.getElementById("menu").innerHTML = `

        <h2>🍜 RAMEN HOKAGE</h2>

        <h3>ANDA DUDUK DI LANTAI?</h3>

        <button onclick="setLantaiPelanggan('LT. 1')">
            🪑 LT. 1
        </button>

        <button onclick="setLantaiPelanggan('LT. 2')">
            🪑 LT. 2
        </button>

    `;
}


function setLantaiPelanggan(lantai) {

    lantaiPelanggan = lantai;

    let mode =
        cekModeOrder();

    if (mode === "KUNCI_LANTAI") {

        if (lantai === "LT. 1") {

            tampilLantai1();

        } else if (lantai === "LT. 2") {

            tampilLantai2();

        }

    }

    if (mode === "GABUNGAN") {

    tampilMenuGabungan();

}

}


function ambilModeDariServer() {

       document.getElementById("menu").innerHTML = `
       <h2>⏳ Memuat pengaturan Ramen Hokage...</h2>
`;    
       fetch(URL_API)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {

            modeOrder = data.modeOrder;

            console.log("Mode dari server:", modeOrder);

            
            pilihLantai();
        })
        .catch(function(error) {

            console.log("Gagal mengambil mode:", error);

        });
}


function resetPesanan() {

    jumlahMenuLt1 = [
        0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0
    ];

    jumlahMenuLt2 = [
        0, 0, 0,
        0, 0, 0,
        0, 0, 0
    ];

}


function tampilLantai1() {

    let tampilanMenu = `
        <h2>🍜 MENU RAMEN HOKAGE LT. 1</h2>

        <button onclick="resetPesanan(); pilihLantai()">
    ← GANTI LANTAI
</button>
    `;

    menuLt1.forEach(function(menu, index) {

        tampilanMenu += `
            <div class="menu-item">
                <h3>${menu.nama}</h3>

                <p>Rp${menu.harga.toLocaleString("id-ID")}</p>

                <button class="btn-kurang" onclick="ubahJumlah(${index}, -1)">−</button>

                <span id="jumlah-${index}">
                    ${jumlahMenuLt1[index]}
                </span>

                <button class="btn-tambah" onclick="ubahJumlah(${index}, 1)">+</button>
            </div>
        `;
    });


    tampilanMenu += `
        <h2 id="totalOrder">TOTAL: Rp0</h2>
    `;


    tampilanMenu += `
        <div id="keranjang">
        <h2>🛒 PESANAN ANDA</h2>
        <div id="daftarPesanan"></div>
        </div>
`   ;


    tampilanMenu += `
        <div id="dataPemesan">

        <h2>👤 DATA PEMESAN</h2>

        <p>Nama Pelanggan</p>

        <input
            type="text"
            id="namaPelanggan"
            placeholder="Masukkan nama"
        >

        <p>Nomor Meja</p>

        <input
            type="text"
            id="nomorMeja"
            placeholder="Contoh: 05"
        >

        <p>Catatan</p>

        <textarea
            id="catatanPesanan"
            placeholder="Contoh: Tidak pedas"
        ></textarea>

        <br><br>

        <button onclick="simpanDataPemesan()">
            LANJUT
        </button>

    </div>
`;
    

document.getElementById("menu").innerHTML = tampilanMenu;
}


function tampilLantai2() {

    let tampilanMenu = `
        <h2>🍜 MENU RAMEN HOKAGE LT. 2</h2>

        <button onclick="resetPesanan(); pilihLantai()">
    ← GANTI LANTAI
</button>
    `;

    menuLt2.forEach(function(menu, index) {

        tampilanMenu += `
        <div class="menu-item">
        <h3>${menu.nama}</h3>

                <p>Rp${menu.harga.toLocaleString("id-ID")}</p>

                <button class="btn-kurang" onclick="ubahJumlahLt2(${index}, -1)">−</button>

                <span id="jumlah-lt2-${index}">
                    ${jumlahMenuLt2[index]}
                </span>

                <button class="btn-tambah" onclick="ubahJumlahLt2(${index}, 1)">+</button>
            </div>
        `;
    });

       tampilanMenu += `
               <h2 id="totalOrderLt2">TOTAL: Rp0</h2>
    `;

       tampilanMenu += `
           <div id="keranjangLt2">

           <h2>🛒 PESANAN ANDA</h2>

           <div id="daftarPesananLt2"></div>

    </div>
`;

tampilanMenu += `
    <div id="dataPemesan">

        <h2>👤 DATA PEMESAN</h2>

        <p>Nama Pelanggan</p>

        <input
            type="text"
            id="namaPelanggan"
            placeholder="Masukkan nama"
        >

        <p>Nomor Meja</p>

        <input
            type="text"
            id="nomorMeja"
            placeholder="Contoh: 05"
        >

        <p>Catatan</p>

        <textarea
            id="catatanPesanan"
            placeholder="Contoh: Tidak pedas"
        ></textarea>

        <br><br>

        <button onclick="simpanDataPemesan()">
            LANJUT
        </button>

    </div>
`;

    document.getElementById("menu").innerHTML =
        tampilanMenu;
}


function tampilMenuGabungan() {

    let tampilanMenu = `
        <h2>🍜 MENU RAMEN HOKAGE</h2>

        <p>
            <strong>MODE GABUNGAN</strong>
        </p>

        <button onclick="pilihLantai()">
            ← GANTI LANTAI
        </button>

        <hr>

        <h2>🍜 MENU LT. 1</h2>
    `;

    menuLt1.forEach(function(menu, index) {

        tampilanMenu += `
            <div class="menu-item">
                <h3>${menu.nama}</h3>

                <p>Rp${menu.harga.toLocaleString("id-ID")}</p>

                <button class="btn-kurang" onclick="ubahJumlahGabunganLt1(${index}, -1)">−</button>

                <span id="jumlah-gabung-lt1-${index}">
                    ${jumlahMenuLt1[index]}
                </span>

                <button class="btn-tambah" onclick="ubahJumlahGabunganLt1(${index}, 1)">+</button>
            </div>
        `;
    });

    tampilanMenu += `
        <hr>

        <h2>🍜 MENU LT. 2</h2>
    `;

    menuLt2.forEach(function(menu, index) {

        tampilanMenu += `
        <div class="menu-item">
        <h3>${menu.nama}</h3>

                <p>Rp${menu.harga.toLocaleString("id-ID")}</p>

                <button class="btn-kurang" onclick="ubahJumlahGabunganLt2(${index}, -1)">−</button>

                <span id="jumlah-gabung-lt2-${index}">
                    ${jumlahMenuLt2[index]}
                </span>

                <button class="btn-tambah" onclick="ubahJumlahGabunganLt2(${index}, -1)">−</button>
            </div>
        `;
    });

    tampilanMenu += `
        <h2 id="totalOrderGabungan">
    TOTAL: Rp0
</h2>

<hr>

<h3>DATA PELANGGAN</h3>

<p>Nama Pelanggan</p>

<input
    type="text"
    id="namaPelanggan"
    placeholder="Masukkan nama"
>

<p>Nomor Meja</p>

<input
    type="text"
    id="nomorMeja"
    placeholder="Masukkan nomor meja"
>

<p>Catatan</p>

<textarea
    id="catatanPesanan"
    placeholder="Contoh: tidak pedas, tanpa daun bawang"
></textarea>

<br><br>

<button onclick="simpanDataPemesan()">
    KONFIRMASI PESANAN
</button>
    `;

    document.getElementById("menu").innerHTML =
        tampilanMenu;
    hitungTotalGabungan();
}


function ubahJumlahGabunganLt1(index, perubahan) {

    jumlahMenuLt1[index] =
        jumlahMenuLt1[index] + perubahan;

    if (jumlahMenuLt1[index] < 0) {

        jumlahMenuLt1[index] = 0;

    }

    document.getElementById(
        "jumlah-gabung-lt1-" + index
    ).innerHTML =
        jumlahMenuLt1[index];

    hitungTotalGabungan();

}


function ubahJumlahGabunganLt2(index, perubahan) {

    jumlahMenuLt2[index] =
        jumlahMenuLt2[index] + perubahan;

    if (jumlahMenuLt2[index] < 0) {

        jumlahMenuLt2[index] = 0;

    }

    document.getElementById(
        "jumlah-gabung-lt2-" + index
    ).innerHTML =
        jumlahMenuLt2[index];

    hitungTotalGabungan();

}


function hitungTotalGabungan() {

    let total = 0;

    menuLt1.forEach(function(menu, index) {

        total =
            total +
            (menu.harga * jumlahMenuLt1[index]);

    });

    menuLt2.forEach(function(menu, index) {

        total =
            total +
            (menu.harga * jumlahMenuLt2[index]);

    });

    document.getElementById("totalOrderGabungan").innerHTML =
        "TOTAL: Rp" +
        total.toLocaleString("id-ID");

}


function ubahJumlahLt2(index, perubahan) {

    jumlahMenuLt2[index] =
        jumlahMenuLt2[index] + perubahan;

    if (jumlahMenuLt2[index] < 0) {
        jumlahMenuLt2[index] = 0;
    }

    document.getElementById(
        "jumlah-lt2-" + index
    ).innerHTML =
        jumlahMenuLt2[index];

    hitungTotalLt2();

    tampilkanKeranjangLt2();
}


function ambilPesananLt2() {

    let daftarPesananLt2 = [];

    menuLt2.forEach(function(menu, index) {

        if (jumlahMenuLt2[index] > 0) {

            let jumlah =
                jumlahMenuLt2[index];

            let subtotal =
                menu.harga * jumlah;

            daftarPesananLt2.push({
                nama: menu.nama,
                harga: menu.harga,
                jumlah: jumlah,
                subtotal: subtotal
            });
        }
    });

    return daftarPesananLt2;
}

function ambilPesananLt1() {

    let daftarPesananLt1 = [];

    menuLt1.forEach(function(menu, index) {

        if (jumlahMenuLt1[index] > 0) {

            let jumlah =
                jumlahMenuLt1[index];

            let subtotal =
                menu.harga * jumlah;

            daftarPesananLt1.push({
                nama: menu.nama,
                harga: menu.harga,
                jumlah: jumlah,
                subtotal: subtotal
            });
        }
    });

    return daftarPesananLt1;
}


function hitungTotalLt2() {

    let total = 0;

    menuLt2.forEach(function(menu, index) {

        total =
            total +
            (menu.harga * jumlahMenuLt2[index]);
    });

    document.getElementById("totalOrderLt2").innerHTML =
        "TOTAL: Rp" +
        total.toLocaleString("id-ID");
}


function tampilkanKeranjangLt2() {

    let daftar = "";

    menuLt2.forEach(function(menu, index) {

        if (jumlahMenuLt2[index] > 0) {

            let subtotal =
                menu.harga * jumlahMenuLt2[index];

            daftar += `
                <p>
                    ${menu.nama}
                    <br>
                    ${jumlahMenuLt2[index]} ×
                    Rp${menu.harga.toLocaleString("id-ID")}
                    =
                    Rp${subtotal.toLocaleString("id-ID")}
                </p>
            `;
        }
    });

    document.getElementById("daftarPesananLt2").innerHTML =
        daftar;
}


// JUMLAH RAMEN BEEF
let jumlahBeef = 0;


// TOMBOL +
function tambahRamenBeef() {

    jumlahBeef = jumlahBeef + 1;

    document.getElementById("jumlahRamenBeef").innerHTML = jumlahBeef;
}


// TOMBOL -
function kurangRamenBeef() {

    if (jumlahBeef > 0) {

        jumlahBeef = jumlahBeef - 1;

        document.getElementById("jumlahRamenBeef").innerHTML = jumlahBeef;
    }
}


// JUMLAH RAMEN BEEF LT. 2
let jumlahBeefLt2 = 0;


// TOMBOL + LT. 2
function tambahRamenBeefLt2() {

    jumlahBeefLt2 = jumlahBeefLt2 + 1;

    document.getElementById("jumlahRamenBeefLt2").innerHTML = jumlahBeefLt2;
}


// TOMBOL - LT. 2
function kurangRamenBeefLt2() {

    if (jumlahBeefLt2 > 0) {

        jumlahBeefLt2 = jumlahBeefLt2 - 1;

        document.getElementById("jumlahRamenBeefLt2").innerHTML = jumlahBeefLt2;
    }
}


let jumlahMenuLt1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


function ubahJumlah(index, perubahan) {

    jumlahMenuLt1[index] = jumlahMenuLt1[index] + perubahan;

    if (jumlahMenuLt1[index] < 0) {

        jumlahMenuLt1[index] = 0;
    }

    document.getElementById("jumlah-" + index).innerHTML =
        jumlahMenuLt1[index];

    hitungTotal();


tampilkanKeranjang();
}


function hitungTotal() {

    let total = 0;

    menuLt1.forEach(function(menu, index) {

        total = total + (menu.harga * jumlahMenuLt1[index]);
    });

    document.getElementById("totalOrder").innerHTML =
        "TOTAL: Rp" + total.toLocaleString("id-ID");
}


function tampilkanKeranjang() {

    let daftar = "";

    menuLt1.forEach(function(menu, index) {

        if (jumlahMenuLt1[index] > 0) {

            let subtotal =
                menu.harga * jumlahMenuLt1[index];

            daftar += `
                <p>
                    ${menu.nama}
                    <br>
                    ${jumlahMenuLt1[index]} ×
                    Rp${menu.harga.toLocaleString("id-ID")}
                    =
                    Rp${subtotal.toLocaleString("id-ID")}
                </p>
            `;
        }
    });

    document.getElementById("daftarPesanan").innerHTML = daftar;
}


function simpanDataPemesan() {

    let nama =
        document.getElementById("namaPelanggan").value;

    let meja =
        document.getElementById("nomorMeja").value;

    let catatan =
        document.getElementById("catatanPesanan").value;


    if (nama === "" || meja === "") {

        alert("Nama dan nomor meja wajib diisi!");

        return;
    }


    dataNama = nama;

    dataMeja = meja;

    dataCatatan = catatan;

    
    let konfirmasi = `
        <h2>🧾 KONFIRMASI PESANAN</h2>

        <p><strong>Nama:</strong> ${nama}</p>

        <p><strong>Nomor Meja:</strong> ${meja}</p>

        <p><strong>Catatan:</strong> ${catatan}</p>

        <hr>

        <h3>🛒 PESANAN</h3>

        <div id="konfirmasiPesanan"></div>

        <h2 id="konfirmasiTotal">TOTAL: Rp0</h2>

        <br>

        <button onclick="tampilMenuGabungan()">
        ← KEMBALI
        </button>

        <button onclick="kirimOrder()">
            KIRIM ORDER
        </button>
    `;


    document.getElementById("menu").innerHTML = konfirmasi;

    tampilkanPesananKonfirmasi();
}


function tampilkanPesananKonfirmasi() {

    let pesananLt1 =
        ambilPesananLt1();

    let pesananLt2 =
        ambilPesananLt2();

    let semuaPesanan =
        pesananLt1.concat(pesananLt2);

    let daftar = "";

    let total = 0;

    semuaPesanan.forEach(function(menu) {

        total =
            total + menu.subtotal;

        daftar += `
            <p>
                <strong>${menu.nama}</strong>
                <br>
                ${menu.jumlah} ×
                Rp${menu.harga.toLocaleString("id-ID")}
                =
                Rp${menu.subtotal.toLocaleString("id-ID")}
            </p>
        `;
    });

    document.getElementById("konfirmasiPesanan").innerHTML =
        daftar;

    document.getElementById("konfirmasiTotal").innerHTML =
        "TOTAL: Rp" +
        total.toLocaleString("id-ID");
}


function kirimOrder() {

    let nomorOrder =
        "RH-" + Date.now();


let daftarPesanan = [];

let pesananLt1 =
    ambilPesananLt1();

let pesananLt2 =
    ambilPesananLt2();

daftarPesanan =
    pesananLt1.concat(pesananLt2);

let total = 0;

daftarPesanan.forEach(function(menu) {

    total =
        total + menu.subtotal;
});
   
let dataOrder = {

    nomorOrder: nomorOrder,

    nama: dataNama,

    meja: dataMeja,

    lantaiPelanggan: lantaiPelanggan,

    catatan: dataCatatan,

    pesanan: daftarPesanan,

    total: total,

    statusOrder: "BARU"
};


console.log("Lantai pelanggan:", lantaiPelanggan);
console.log("Data order:", dataOrder);


fetch(URL_API, {

    method: "POST",

    mode: "no-cors",

    body: JSON.stringify(dataOrder)

})
.then(function() {

    console.log(
        "Permintaan order sudah dikirim ke Google Sheets."
    );

    alert(
        "ORDER BERHASIL DIKIRIM!\n\n" +
        "Nomor Order: " + nomorOrder + "\n" +
        "Nama: " + dataNama + "\n" +
        "Meja: " + dataMeja + "\n" +
        "Total: Rp" +
        total.toLocaleString("id-ID") +
        "\n\n" +
        "Terima kasih sudah memesan di Ramen Hokage!"
    );

})
.catch(function(error) {

    console.log(
        "Gagal mengirim order:",
        error
    );

    alert(
        "ORDER GAGAL DIKIRIM!\n\n" +
        "Silakan coba lagi."
    );

});

}


ambilModeDariServer();


