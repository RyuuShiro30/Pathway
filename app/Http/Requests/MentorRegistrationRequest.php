<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MentorRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            'photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'expertise' => ['required', 'string', 'max:255'],

            'bio' => ['nullable', 'string', 'max:300'],

            'portfolio_url' => [
                'required',
                'url',
                'max:255',
            ],

            'certificates' => ['nullable', 'array', 'max:10'],
            'certificates.*' => [
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:5120',
            ],

            'mentor_type' => [
                'required',
                'in:free,paid',
            ],

            'price_per_session' => [
                'required_if:mentor_type,paid',
                'nullable',
                'numeric',
                'min:0',
            ],

            'is_available' => [
                'required',
                'boolean',
            ],
        ];
    }
}