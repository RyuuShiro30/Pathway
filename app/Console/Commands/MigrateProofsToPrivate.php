<?php

namespace App\Console\Commands;

use App\Models\MentoringSession;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateProofsToPrivate extends Command
{
    protected $signature = 'proofs:migrate-to-private
                            {--dry-run : Jalankan simulasi tanpa menyalin atau menghapus berkas}
                            {--delete-source : Hapus berkas sumber dari disk public setelah disalin}';

    protected $description = 'Pindahkan berkas bukti pembayaran, refund, dan sesi dari disk public ke disk local';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $deleteSource = (bool) $this->option('delete-source');

        $publicDisk = Storage::disk('public');
        $localDisk = Storage::disk('local');

        $columns = [
            'payment_dp_proof',
            'payment_final_proof',
            'refund_proof',
            'proof_file',
        ];

        $referencedPaths = collect();

        foreach ($columns as $column) {
            $paths = MentoringSession::query()
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->pluck($column);

            $referencedPaths = $referencedPaths->merge($paths);
        }

        $uniquePaths = $referencedPaths
            ->map(static fn ($path) => ltrim(preg_replace('#^(public/|storage/)#', '', trim((string) $path)), '/'))
            ->filter(static fn ($path) => ! empty($path))
            ->unique()
            ->values();

        $moved = 0;
        $skipped = 0;
        $missing = 0;

        foreach ($uniquePaths as $path) {
            $existsOnLocal = $localDisk->exists($path);
            $existsOnPublic = $publicDisk->exists($path);

            if ($existsOnLocal) {
                $skipped++;

                if (! $dryRun && $deleteSource && $existsOnPublic) {
                    $publicDisk->delete($path);
                }
            } elseif ($existsOnPublic) {
                if (! $dryRun) {
                    $stream = $publicDisk->readStream($path);
                    if ($stream !== false) {
                        $localDisk->writeStream($path, $stream);
                        if (is_resource($stream)) {
                            fclose($stream);
                        }
                    } else {
                        $localDisk->put($path, $publicDisk->get($path));
                    }

                    if ($deleteSource) {
                        $publicDisk->delete($path);
                    }
                }

                $moved++;
            } else {
                $missing++;
            }
        }

        if ($dryRun) {
            $this->info('[DRY-RUN] Simulasi selesai. Tidak ada berkas yang disalin atau dihapus.');
        } else {
            $this->info('Pemindahan berkas bukti berhasil diselesaikan.');
        }

        $this->line("Dipindah: {$moved}");
        $this->line("Dilewati: {$skipped}");
        $this->line("Hilang: {$missing}");

        return self::SUCCESS;
    }
}
