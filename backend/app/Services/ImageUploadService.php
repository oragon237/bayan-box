<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Image upload + optimization service.
 *
 * Accepts an uploaded image, resizes/compresses it with GD to a max dimension
 * and JPEG quality, and stores it on the public disk. Returns a URL path.
 */
class ImageUploadService
{
    public function __construct(
        protected int $maxDimension = 1200,
        protected int $quality = 82,
    ) {}

    /**
     * Upload + optimize an image. Returns the public URL path.
     */
    public function optimize(UploadedFile $file, string $folder = 'products'): string
    {
        $image = imagecreatefromstring($file->get());

        if ($image === false) {
            throw new \RuntimeException('Unable to read image. Only JPEG, PNG, GIF, WebP, BMP are supported.');
        }

        // Resize to max dimension preserving aspect ratio
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width > $this->maxDimension || $height > $this->maxDimension) {
            $scale = min($this->maxDimension / $width, $this->maxDimension / $height);
            $newWidth = (int) round($width * $scale);
            $newHeight = (int) round($height * $scale);

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }

        // Encode to JPEG (with alpha flattened to white for transparency)
        $bg = imagecreatetruecolor(imagesx($image), imagesy($image));
        $white = imagecolorallocate($bg, 255, 255, 255);
        imagefill($bg, 0, 0, $white);
        imagecopy($bg, $image, 0, 0, 0, 0, imagesx($image), imagesy($image));

        ob_start();
        imagejpeg($bg, null, $this->quality);
        $data = ob_get_clean();

        imagedestroy($image);
        imagedestroy($bg);

        $name = $folder.'/'.date('Y/m/d').'/'.Str::random(24).'.jpg';

        Storage::disk('public')->put($name, $data);

        return Storage::disk('public')->url($name);
    }
}