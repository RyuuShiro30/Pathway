<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CourseMaterialSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // =================================================================
        // 1. SEEDER UNTUK UI/UX DESIGN DASAR
        // =================================================================
        $uiuxCourse = DB::table('courses')->where('title', 'UI/UX Design Dasar')->first();

        if ($uiuxCourse) {
            $uiuxMaterials = [
                [
                    'course_id' => $uiuxCourse->id,
                    'section_name' => 'Bagian 1: Pengantar',
                    'title' => 'Pendahuluan UI/UX Design',
                    'content_body' => '<p>Halo! Selamat datang di course <strong>UI/UX Design Dasar</strong>.</p><p>UI (User Interface) adalah tampilan visual, sedangkan UX (User Experience) adalah pengalaman pengguna saat berinteraksi dengan produk.</p>',
                    'sequence_order' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'course_id' => $uiuxCourse->id,
                    'section_name' => 'Bagian 1: Pengantar',
                    'title' => 'Prinsip Dasar Layout',
                    'content_body' => '<p>Layout yang baik adalah kunci dari desain yang mudah digunakan.</p><ul><li>Gunakan Grid System</li><li>Perhatikan White Space</li></ul>',
                    'sequence_order' => 2,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'course_id' => $uiuxCourse->id,
                    'section_name' => 'Bagian 2: Praktik',
                    'title' => 'Wireframing di Figma',
                    'content_body' => '<p>Wireframe adalah kerangka kasar dari sebuah desain web atau aplikasi di Figma.</p>',
                    'sequence_order' => 3,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ];

            DB::table('course_materials')->insert($uiuxMaterials);
        }

        // =================================================================
        // 2. SEEDER UNTUK DASAR PEMROGRAMAN PYTHON
        // =================================================================
        $pythonCourse = DB::table('courses')->where('title', 'Dasar Pemrograman Python')->first();

        if ($pythonCourse) {
            $pythonModules = [
                'Modul 1: Pengenalan & Persiapan' => [
                    'Apa itu Python?' => '<p>Python adalah bahasa pemrograman tingkat tinggi yang diciptakan oleh Guido van Rossum dan dirilis pertama kali pada tahun 1991. Python dirancang dengan filosofi desain yang menekankan keterbacaan kode, menggunakan indentasi yang signifikan. Bahasa ini sangat populer untuk Web Development, Data Science, Artificial Intelligence, dan otomatisasi.</p>',
                    'Instalasi Python' => '<p>Untuk menginstal Python, kunjungi situs resmi <strong>python.org</strong> dan unduh versi terbaru sesuai sistem operasi Anda. Saat instalasi di Windows, pastikan mencentang kotak <strong>"Add Python to PATH"</strong> agar perintah Python dapat dijalankan langsung dari terminal atau command prompt.</p>',
                    'Mengenal Code Editor & IDE' => '<p>Code Editor adalah tempat Anda menulis kode. Untuk Python, <strong>Visual Studio Code (VS Code)</strong> sangat direkomendasikan karena ringan dan gratis. Pastikan Anda menginstal ekstensi Python buatan Microsoft di dalam VS Code. Alternatif lain yang lebih berat namun lengkap adalah <strong>PyCharm</strong>.</p>',
                    'Program "Hello World" Pertama' => '<p>Tradisi dalam belajar bahasa pemrograman baru adalah membuat program Hello World. Di Python, ini sangat sederhana. Buka editor Anda, buat file <code>hello.py</code>, dan tulis kode berikut:</p><pre><code class="language-python">print("Hello, World!")</code></pre><p>Jalankan di terminal dengan perintah <code>python hello.py</code>.</p>'
                ],
                'Modul 2: Sintaks Dasar & Variabel' => [
                    'Aturan Dasar Sintaks Python' => '<p>Berbeda dengan bahasa C++ atau PHP yang menggunakan kurung kurawal <code>{}</code>, Python menggunakan <strong>indentasi (spasi/tab)</strong> untuk mendefinisikan blok kode. Jika indentasinya salah, program akan menghasilkan <em>IndentationError</em>.</p>',
                    'Komentar dalam Python' => '<p>Komentar digunakan untuk memberi catatan pada kode dan tidak akan dieksekusi oleh komputer.</p><pre><code class="language-python"># Ini adalah komentar satu baris\n\n"""\nIni adalah komentar\nmulti-baris\n"""</code></pre>',
                    'Variabel dan Aturan Penamaan' => '<p>Variabel digunakan untuk menyimpan data. Di Python, Anda tidak perlu mendeklarasikan tipe data secara eksplisit. Gunakan format <em>snake_case</em> untuk penamaan.</p><pre><code class="language-python">nama_depan = "Budi"\numur_sekarang = 20</code></pre>',
                    'Tipe Data Dasar' => '<p>Tipe data dasar di Python meliputi:</p><ul><li><strong>Integer (int):</strong> Bilangan bulat (contoh: <code>10</code>)</li><li><strong>Float:</strong> Bilangan desimal (contoh: <code>3.14</code>)</li><li><strong>String (str):</strong> Teks (contoh: <code>"Halo"</code>)</li><li><strong>Boolean (bool):</strong> Benar/Salah (<code>True</code> / <code>False</code>)</li></ul>',
                    'Konversi Tipe Data (Casting)' => '<p>Anda bisa mengubah tipe data satu ke yang lain menggunakan fungsi bawaan seperti <code>int()</code>, <code>float()</code>, atau <code>str()</code>.</p><pre><code class="language-python">angka_teks = "10"\nangka_asli = int(angka_teks) # Berubah jadi integer</code></pre>'
                ],
                'Modul 3: Operasi Dasar' => [
                    'Operator Aritmatika' => '<p>Gunakan operator aritmatika untuk perhitungan matematika:</p><pre><code class="language-python">tambah = 5 + 2\nkurang = 5 - 2\nkali = 5 * 2\nbagi = 5 / 2 # Hasil float: 2.5\nbagi_bulat = 5 // 2 # Hasil int: 2\nmodulus = 5 % 2 # Sisa bagi: 1\npangkat = 5 ** 2 # 25</code></pre>',
                    'Operator Penugasan (Assignment)' => '<p>Operator ini menugaskan nilai ke variabel. Bentuk singkatnya membantu menghemat penulisan kode.</p><pre><code class="language-python">x = 10\nx += 5 # Sama dengan x = x + 5 (Hasil: 15)</code></pre>',
                    'Operator Perbandingan' => '<p>Mengembalikan nilai Boolean (True/False).</p><pre><code class="language-python">x = 10\nprint(x == 10) # True\nprint(x != 5)  # True\nprint(x > 15)  # False</code></pre>',
                    'Operator Logika' => '<p>Digunakan untuk menggabungkan kondisi kondisional.</p><pre><code class="language-python">x = 5\nprint(x > 3 and x < 10) # True (Keduanya harus benar)\nprint(x > 10 or x == 5) # True (Salah satu benar)\nprint(not(x == 5)) # False (Kebalikan)</code></pre>'
                ],
                'Modul 4: Interaksi Pengguna (I/O)' => [
                    'Mengambil Input Pengguna' => '<p>Gunakan fungsi <code>input()</code> untuk menerima input teks dari keyboard. Hasil defaultnya selalu bertipe String.</p><pre><code class="language-python">nama = input("Masukkan nama Anda: ")\nprint("Halo", nama)</code></pre>',
                    'Memformat String (String Formatting)' => '<p>Cara paling modern dan disarankan sejak Python 3.6 adalah menggunakan <strong>f-strings</strong> (menyisipkan huruf <code>f</code> sebelum tanda kutip).</p><pre><code class="language-python">nama = "Budi"\numur = 20\nprint(f"Nama saya {nama} dan umur saya {umur} tahun.")</code></pre>',
                    'Manipulasi String Dasar' => '<p>String memiliki berbagai metode bawaan untuk manipulasi.</p><pre><code class="language-python">teks = "Halo Dunia"\nprint(teks.lower()) # "halo dunia"\nprint(teks.upper()) # "HALO DUNIA"\nprint(teks[0:4])    # Slicing, hasil: "Halo"</code></pre>'
                ],
                'Modul 5: Kontrol Alur (Control Flow)' => [
                    'Percabangan Bersyarat Dasar' => '<p>Statement <code>if</code> mengeksekusi blok kode hanya jika kondisinya <code>True</code>.</p><pre><code class="language-python">nilai = 80\nif nilai >= 75:\n    print("Anda Lulus!")</code></pre>',
                    'Percabangan Lanjutan' => '<p>Gunakan <code>elif</code> (else if) untuk kondisi ganda, dan <code>else</code> untuk kondisi terakhir jika semua salah.</p><pre><code class="language-python">nilai = 60\nif nilai >= 80:\n    print("A")\nelif nilai >= 60:\n    print("B")\nelse:\n    print("C")</code></pre>',
                    'Perulangan Terbatas (For Loop)' => '<p>Digunakan untuk melakukan iterasi pada urutan data (seperti list, string, atau range).</p><pre><code class="language-python"># Mencetak angka 0 sampai 4\nfor i in range(5):\n    print(i)</code></pre>',
                    'Perulangan Bersyarat (While Loop)' => '<p>Mengeksekusi blok kode selama kondisi bernilai True. Awas jangan sampai membuat <em>infinite loop</em> (looping tanpa henti) jika lupa mengubah variabel kondisinya.</p><pre><code class="language-python">x = 0\nwhile x < 3:\n    print(x)\n    x += 1</code></pre>',
                    'Kendali Perulangan' => '<p><code>break</code> menghentikan loop sepenuhnya, sedangkan <code>continue</code> melewati iterasi saat ini dan lanjut ke iterasi berikutnya.</p><pre><code class="language-python">for i in range(5):\n    if i == 2:\n        continue # Lewati angka 2\n    if i == 4:\n        break # Hentikan loop sebelum mencetak 4\n    print(i)</code></pre>'
                ],
                'Modul 6: Struktur Data (Collections)' => [
                    'Pengenalan List' => '<p>List adalah struktur data berurutan yang dapat diubah (mutable). Dibuat menggunakan kurung siku <code>[]</code>.</p><pre><code class="language-python">buah = ["apel", "mangga", "pisang"]\nprint(buah[0]) # Output: apel\nbuah[0] = "jeruk" # Mengubah isi</code></pre>',
                    'Metode Bawaan List' => '<p>Berbagai fungsi untuk memanipulasi List.</p><pre><code class="language-python">angka = [1, 2, 3]\nangka.append(4)   # Menambah di akhir\nangka.insert(0, 0) # Menyisipkan di index 0\nangka.pop()       # Menghapus elemen terakhir</code></pre>',
                    'Pengenalan Tuple' => '<p>Tuple mirip dengan List, namun <strong>immutable</strong> (tidak dapat diubah setelah dibuat). Menggunakan kurung biasa <code>()</code>. Sangat cepat dalam pemrosesan data.</p><pre><code class="language-python">koordinat = (10, 20)\n# koordinat[0] = 15 -> Ini akan menghasilkan ERROR</code></pre>',
                    'Pengenalan Dictionary' => '<p>Dictionary menyimpan data dalam bentuk pasangan <strong>Key:Value</strong> menggunakan kurung kurawal <code>{}</code>.</p><pre><code class="language-python">data_diri = {\n    "nama": "Budi",\n    "umur": 25\n}\nprint(data_diri["nama"])</code></pre>',
                    'Memanipulasi Dictionary' => '<p>Anda bisa menambah, mengubah, dan menghapus kunci pada dictionary dengan sangat mudah.</p><pre><code class="language-python">user = {"nama": "Andi"}\nuser["umur"] = 30 # Menambah data baru\nuser["nama"] = "Budi" # Mengubah data\ndel user["umur"] # Menghapus data</code></pre>',
                    'Pengenalan Set' => '<p>Set adalah himpunan elemen unik tanpa urutan. Berguna untuk membuang data duplikat.</p><pre><code class="language-python">angka = {1, 2, 2, 3, 3}\nprint(angka) # Output: {1, 2, 3}</code></pre>'
                ],
                'Modul 7: Fungsi (Functions)' => [
                    'Membuat dan Memanggil Fungsi' => '<p>Fungsi adalah blok kode yang hanya berjalan jika dipanggil. Dideklarasikan menggunakan kata kunci <code>def</code>.</p><pre><code class="language-python">def sapa():\n    print("Halo, selamat pagi!")\n\nsapa() # Memanggil fungsi</code></pre>',
                    'Parameter dan Argumen' => '<p>Fungsi dapat menerima input berupa parameter/argumen.</p><pre><code class="language-python">def sapa_nama(nama):\n    print(f"Halo, {nama}!")\n\nsapa_nama("Budi")</code></pre>',
                    'Nilai Kembalian (Return)' => '<p>Gunakan <code>return</code> untuk mengembalikan sebuah nilai dari fungsi tersebut untuk disimpan ke dalam variabel.</p><pre><code class="language-python">def tambah(a, b):\n    return a + b\n\nhasil = tambah(5, 10)\nprint(hasil) # 15</code></pre>',
                    'Ruang Lingkup Variabel (Scope)' => '<p>Variabel yang dibuat di dalam fungsi bersifat <strong>Lokal</strong>, tidak bisa diakses di luarnya. Sedangkan variabel di luar fungsi adalah <strong>Global</strong>.</p>',
                    'Fungsi Anonim (Lambda)' => '<p>Fungsi singkat satu baris tanpa nama menggunakan kata kunci <code>lambda</code>.</p><pre><code class="language-python">kuadrat = lambda x: x * x\nprint(kuadrat(5)) # 25</code></pre>'
                ],
                'Modul 8: Penanganan Error & Modul' => [
                    'Membaca Pesan Kesalahan' => '<p>Saat membuat program, Anda akan bertemu Error. <strong>SyntaxError</strong> terjadi jika salah ketik aturan dasar. <strong>ValueError</strong> terjadi jika nilai tidak sesuai, dan <strong>IndexError</strong> jika mengakses urutan data yang tidak ada.</p>',
                    'Error Handling Dasar (Try-Except)' => '<p>Mencegah program hancur/berhenti mendadak dengan menangkap error yang terprediksi.</p><pre><code class="language-python">try:\n    angka = int(input("Masukkan angka: "))\nexcept ValueError:\n    print("Yang Anda masukkan bukan angka!")</code></pre>',
                    'Mengimpor Modul Bawaan' => '<p>Python memiliki baterai fitur yang lengkap (standard library). Gunakan <code>import</code> untuk menggunakan modul luar.</p><pre><code class="language-python">import math\n\nprint(math.sqrt(16)) # Akar kuadrat, hasil: 4.0</code></pre>'
                ]
            ];

            $pythonMaterials = [];
            $sequenceOrder = 1;

            foreach ($pythonModules as $sectionName => $topics) {
                foreach ($topics as $title => $contentBody) {
                    $pythonMaterials[] = [
                        'course_id'      => $pythonCourse->id,
                        'section_name'   => $sectionName,
                        'title'          => $title,
                        'content_body'   => $contentBody,
                        'sequence_order' => $sequenceOrder,
                        'created_at'     => $now,
                        'updated_at'     => $now,
                    ];
                    $sequenceOrder++;
                }
            }

            // Insert 35 data sekaligus secara bulk insert
            DB::table('course_materials')->insert($pythonMaterials);
        }
    }
}