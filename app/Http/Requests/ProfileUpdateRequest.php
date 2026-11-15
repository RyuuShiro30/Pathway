<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'bank_name' => ['nullable', 'required_with:bank_account_number,bank_account_holder', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'required_with:bank_name,bank_account_holder', 'string', 'max:50'],
            'bank_account_holder' => ['nullable', 'required_with:bank_name,bank_account_number', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'bank_name.required_with' => 'Nama bank wajib diisi jika melengkapi data rekening.',
            'bank_account_number.required_with' => 'Nomor rekening wajib diisi jika melengkapi data rekening.',
            'bank_account_holder.required_with' => 'Nama pemilik rekening wajib diisi jika melengkapi data rekening.',
        ];
    }
}