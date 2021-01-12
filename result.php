<?php

define('HOST', 'localhost');
define('DB', 'game');
define('USERNAME', 'root');
define('PASSWORD', '');

$mysqli = mysqli_connect(HOST, USERNAME, PASSWORD, DB);

mysqli_set_charset($mysqli, 'utf8');

$postData = file_get_contents('php://input');
$data = json_decode($postData, true);
if (!empty($data)) {
    $query = "INSERT INTO `result` (`score`, `time`) VALUES ('$data[score]', '$data[time]')";
    $res = mysqli_query($mysqli, $query);
    echo $query;
} else {
    $query = 'SELECT * FROM `result` ORDER BY `score` DESC LIMIT 0,3';
    $res = mysqli_query($mysqli, $query);
    echo json_encode(mysqli_fetch_all($res, MYSQLI_ASSOC));
}
