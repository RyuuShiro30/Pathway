
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE point_transactions
            DROP CONSTRAINT IF EXISTS point_transactions_transaction_type_check
        ");

        DB::statement("
            ALTER TABLE point_transactions
            ADD CONSTRAINT point_transactions_transaction_type_check
            CHECK (transaction_type IN (
                'earned_mentoring',
                'redeemed_badge',
                'redeemed_merchandise',
                'admin_bonus'
            ))
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE point_transactions
            DROP CONSTRAINT IF EXISTS point_transactions_transaction_type_check
        ");

        DB::statement("
            ALTER TABLE point_transactions
            ADD CONSTRAINT point_transactions_transaction_type_check
            CHECK (transaction_type IN (
                'earned_mentoring',
                'redeemed_badge',
                'admin_bonus'
            ))
        ");
    }
};
