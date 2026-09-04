<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
| HABI subfolder/API front controller.
| Copy this file to .../htdocs/www.clientwebsitedemo.com/habi/index.php
| The Laravel application itself must live OUTSIDE the htdocs tree:
|   /home/rao1983/habi-backend
| (Adjust $backend if you chose a different location.)
*/

$backend = '/home/rao1983/habi-backend';

require $backend.'/vendor/autoload.php';

$app = require_once $backend.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
