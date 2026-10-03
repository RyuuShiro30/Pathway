<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MentorProfileController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth')->group(function () {
    Route::get('/mentor/profile', [MentorProfileController::class, 'show']);
    Route::patch('/mentor/availability', [MentorProfileController::class, 'updateAvailability']);
});