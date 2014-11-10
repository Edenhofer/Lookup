<?php
/*
Verarbeitung des Vertretungsplans in php
Gordian Edenhofer 09-Jun-2014	
*/
session_start();

/* Bestimmung der Quelle des Aufrufs, z.B. Linux/Windows/OS X bzw. mobile */
$debug = (strstr($_SERVER["QUERY_STRING"], "debug"));					// debugging-mode
if (isset($_SESSION['uinfo']) === false) {
	if (strpos($_SERVER['HTTP_USER_AGENT'], "Windows") !== False) $_SESSION['uinfo'] = '?desktop';
	else if (strpos($_SERVER['HTTP_USER_AGENT'], "OS X") !== False && preg_match("/OS \d/", $_SERVER['HTTP_USER_AGENT']) != 1) $_SESSION['uinfo'] = '?desktop';
	else if (strpos($_SERVER['HTTP_USER_AGENT'], "Linux") !== False && strpos($_SERVER['HTTP_USER_AGENT'], "Android") === False) $_SESSION['uinfo'] = '?Linux';
	else $_SESSION['uinfo'] = '?m';
}
if (strpos($_SERVER["QUERY_STRING"], "iframe") !== false) $_SESSION['uinfo'] = '?iframe';	// iFrame-mode

/* Default-Werte, die im weiteren Verlauf geaender werden koennen */
$source_url = "/tmp/v.html";								// Pfad zum Vertretungsplan
$footnote = "Erdacht, erstellt und gepflegt von Gordian&nbsp;Edenhofer.";		// Fussnote mit Namensnennung
$dc = "Auswahl anpassen";									// "Cookie-Loeschen"-Text
$rt = "Neu Laden";											// "Seite neu laden"-Text
$column = 4;												// Anzahl der Spalten
$nlfnc = 1;													// Neue Zeil fuer neues Fach [bei Tabelle]: 1 = False, 0 = True
$font_size = 100;											// Schriftgroesse in %
//$cookie_name = "k";										Name des Cookies
//															Es muss noch manuell "$_COOKIE['NAME']" und "setcookie" geändert werden
$input_font_size = 80;

if (strpos($_SESSION['uinfo'], "?m") !== False) {			// Einstellungen fuer die mobile Version
	$column = 2;
	$nlfnc = 0;
	$font_size = "3em";
	$input_font_size = "0.8em";
	$footer_font_size = "0.55em";
	$footnote_font_size = "0.75em";
} else if (strpos($_SESSION['uinfo'], "?desktop") !== False || strpos($_SESSION['uinfo'], "?Linux") !== False) {	// Desktop Version
	$column = 4;
	$nlfnc = 1;
	$font_size = "1em";
	$input_font_size = "0.8em";
	$footer_font_size = "0.9em";
	$footnote_font_size = "0.75em";
} else if (strpos($_SESSION['uinfo'], "?iframe") !== False) {				// iFrame-Version
	$column = 2;
	$nlfnc = 0;
	$font_size = "2em";
	$input_font_size = "0.8em";
	$footer_font_size = "0.55em";
	$footnote_font_size = "0.75em";
}


$p = 0;											// "$p": "Druckvariabel"
$l = 0;											// "$l": Anzahl der Zeilen
$flagg = 0;										// Markierung
$n = 0;											// Zaehler
if ($column != 1) $td = "<td colspan=\"" . ($column-1) . "\"></td>";
else $td = "";
$br = "\n<tr><td>&nbsp;</td>" . $td . "</tr>\n";
$kurse_a = array(									// Kurse der 12. Klasse
	'Bio_14\/5' => "Bio bei Frau S.",
	'Bio_14\/6' => "Bio bei Frau N.",
	'Bio_14\/1' => "Bio LK bei Herrn G.",
	'Bio_14\/2' => "Bio LK bei Herrn H.",
	'Ch_14\/5' => "Chemie bei Frau S.",
	'Ch_14\/6' => "Chemie bei Herrn S. [CH06]",
	'Ch_14\/7' => "Chemie bei Herrn S. [CH07]",
	'Ch_14\/1' => "Chemie LK bei Frau M.",
	'Ch_14\/2' => "Chemie LK bei Herrn H.",
	'D_14\/5' => "Deutsch bei Frau S.",
	'D_14\/6' => "Deutsch bei Herrn K.",
	'D_14\/7' => "Deutsch bei Frau F.",
	'D_14\/8' => "Deutsch bei Frau G.",
	'D_14\/9' => "Deutsch bei Frau K.",
	'D_14\/10' => "Deutsch bei Frau L.",
	'D_14\/1' => "Deutsch LK bei Herrn B.",
	'E_14\/5' => "Englisch bei Herrn W.",
	'E_14\/6' => "Englisch bei Frau S.",
	'E_14\/7' => "Englisch bei Frau B.",
	'E_14\/8' => "Englisch bei Frau K.",
	'E_14\/1' => "Englisch LK bei Frau B.",
	'E_14\/2' => "Englisch LK bei Frau F.",
	'F_14\/5' => "Franz&ouml;sisch bei Frau L.",
	'G_14\/5' => "Geschichte bei Frau D.",
	'G_14\/6' => "Geschichte bei Herrn M.",
	'G_14\/7' => "Geschichte bei Frau S.",
	'G_14\/8' => "Geschichte bei Herrn W.",
	'G_14\/33' => "Geschichte bei Herrn R.",
	'G_14\/1' => "Geschichte LK bei Frau W.",
	'Ku_14\/5' => "Kunst bei Frau V.",
	'Ku_14\/6' => "Kunst bei Frau J. [KU06]",
	'Ku_14\/7' => "Kunst bei Frau J. [KU07]",
	'Ku_14\/8' => "Kunst bei Frau S.",
	'Ku_14\/1' => "Kunst LK bei Frau V.",
	'L_14\/5' => "Latein bei Herrn S.",
	'M_14\/5' => "Mathe bei Herrn C.",
	'M_14\/6' => "Mathe bei Herrn M.",
	'M_14\/7' => "Mathe bei Herrn H.",
	'M_14\/8' => "Mathe bei Herrn B.",
	'M_14\/9' => "Mathe bei Herrn S.",
	'M_14\/2' => "Mathe LK bei Herrn T.",
	'Mu_14\/5' => "Musik bei Herrn L.",
	'Ph_14\/5' => "Physik bei Herrn T.",
	'Ph_14\/1' => "Physik LK bei Herrn C.",
	'PoWi_14\/5' => "PoWi bei Frau I.",
	'PoWi_14\/6' => "PoWi bei Herrn H.",
	'PoWi_14\/7' => "PoWi bei Frau F.",
	'PoWi_14\/1' => "PoWi LK bei Herrn G.",
	'PoWi_14\/2' => "PoWi LK bei Frau W.",
	'PoWi_14\/3' => "PoWi LK bei Herrn K.",
	'eR_14\/11' => "Evangelische Religion bei Frau K.",
	'eR_14\/12' => "Evangelische Religion bei Herrn K.",
	'kR_14\/21' => "Katholische Religion bei Herrn S.",
	'Spa_14\/5' => "Spanisch bei Frau K.",
	'Spa_14\/77' => "Spanisch bei Frau V.",
	'Spa_14\/2' => "Spanisch LK bei Frau V.",
	'T_14\/1' => "Sport bei Frau B.",
	'T_14\/2' => "Sport bei Frau F. [T02]",
	'T_14\/3' => "Sport bei Herrn G.",
	'T_14\/4' => "Sport bei Frau F. [T04]",
	'T_14\/9' => "Sport bei Herrn S.",
	'T_14\/6' => "Sport bei Herrn P." );
$kurse_q = array(									// Kurse der 13. Klasse
	'Bio_13\/5' => "Bio bei Frau S.",
	'Bio_13\/6' => "Bio bei Frau N.",
	'Bio_13\/1' => "Bio LK bei  G.",
	'Bio_13\/2' => "Bio LK bei Herrn H.",
	'Ch_13\/5' => "Chemie bei Frau S.",
	'Ch_13\/7' => "Chemie bei Herrn S.",
	'Ch_13\/1' => "Chemie LK bei Frau M.",
	'Ch_13\/2' => "Chemie LK bei Herrn H.",
	'D_13\/5' => "Deutsch bei Frau S.",
	'D_13\/6' => "Deutsch bei Herrn K.",
	'D_13\/7' => "Deutsch bei Frau F.",
	'D_13\/8' => "Deutsch bei Frau G.",
	'D_13\/9' => "Deutsch bei Frau K.",
	'D_13\/10' => "Deutsch bei Frau L.",
	'D_13\/1' => "Deutsch LK bei Herrn B.",
	'E_13\/5' => "Englisch bei Herrn W.",
	'E_13\/6' => "Englisch bei Frau S.",
	'E_13\/7' => "Englisch bei Frau B.",
	'E_13\/8' => "Englisch bei Frau K.",
	'E_13\/1' => "Englisch LK bei Frau B.",
	'E_13\/2' => "Englisch LK bei Frau F.",
	'Eth_13\/5' => "Ethik bei Frau S. [ETH05]",
	'Eth_13\/6' => "Ethik bei Herrn B.",
	'Eth_13\/7' => "Ethik bei Frau S. [ETH07]",
	'Eth_13\/8' => "Ethik bei Herrn B.",
	'F_13\/5' => "Franz&ouml;sisch bei Frau L.",
	'G_13\/5' => "Geschichte bei Frau D.",
	'G_13\/6' => "Geschichte bei Herrn M.",
	'G_13\/7' => "Geschichte bei Frau S.",
	'G_13\/8' => "Geschichte bei Herrn W.",
	'G_13\/33' => "Geschichte bei Herrn R.",
	'G_13\/1' => "Geschichte LK bei Frau W.",
	'[INFO]_13\/5' => "[FEHLER] Informatik bei Herrn P.",
	'Ku_13\/6' => "Kunst bei Frau J. [KU06]",
	'Ku_13\/7' => "Kunst bei Frau J. [KU07]",
	'Ku_13\/8' => "Kunst bei Frau S.",
	'Ku_13\/1' => "Kunst LK bei Frau V.",
	'L_13\/5' => "Latein bei Herrn S.",
	'M_13\/5' => "Mathe bei Herrn C.",
	'M_13\/6' => "Mathe bei Herrn M.",
	'M_13\/7' => "Mathe bei Frau H.",
	'M_13\/8' => "Mathe bei Herrn B.",
	'M_13\/9' => "Mathe bei Herrn S.",
	'M_13\/2' => "Mathe LK bei Herrn T.",
	'Mu_13\/5' => "Musik bei Herrn L.",
	'Ph_13\/5' => "Physik bei Herrn T.",
	'Ph_13\/1' => "Physik LK bei Herrn C.",
	'PoWi_13\/5' => "PoWi bei Frau I.",
	'PoWi_13\/6' => "PoWi bei Herrn H.",
	'PoWi_13\/7' => "PoWi bei Frau F.",
	'PoWi_13\/1' => "PoWi LK bei Herrn G.",
	'PoWi_13\/2' => "PoWi LK bei Frau W.",
	'PoWi_13\/3' => "PoWi LK bei Herrn K.",
	'eR_13\/11' => "Evangelische Religion bei Frau K.",
	'eR_13\/12' => "Evangelische Religion bei Herrn K.",
	'kR_13\/21' => "Katholische Religion bei Herrn S.",
	'Spa_13\/5' => "Spanisch bei Frau K.",
	'Spa_13\/77' => "Spanisch bei Frau V.",
	'Spa_13\/2' => "Spanisch LK bei Frau V.",
	'T_13\/1' => "Sport bei Frau B.",
	'T_13\/2' => "Sport bei Frau F. [T02]",
	'T_13\/3' => "Sport bei Herrn G.",
	'T_13\/4' => "Sport bei Frau F. [T04]",
	'T_13\/9' => "Sport bei Herrn S.",
	'T_13\/6' => "Sport bei Herrn P." );
$z = array(										// Zweig
	"G" => "Gymnasium",
	" R" => "Realschule",
	"  H" => "Hauptschule" );
$jg = array(									// Jahrgangsstufe
	"05" => "5. Klasse",
	"06" => "6. Klasse",
	"07" => "7. Klasse",
	"08" => "8. Klasse",
	"09" => "9. Klasse",
	"EP " => "E-Phase",
	"12" => "Q1 und Q2",
	"13" => "Q3 und Q4" );
$p = array(										// Parallel Klassen
	"-" => "bitte w&auml;hlen",
	"a" => "a",
	"b" => "b",
	"c" => "c",
	"d" => "d",
	"e" => "e",
	"f" => "f" );
$ep = array(									// Parallel Klassen der E-Phase
	"-" => "bitte w&auml;hlen",
	'01' => "01",
	'02' => "02",
	'03' => "03",
	'04' => "04",
	'05' => "05",
	'06' => "06" );

function newlineif() {
	global $p, $l, $br;
	if ($p == 1) {
		print $br;
		$l += 1;
	}
	$p = 0;
}

/* Beginn des HTML-Codes bzw. Beginn der Generierung */
echo '<!DOCTYPE HTML>
<html>
<head>
<meta charset="UTF-8">
<title>Gordian Edenhofers individueller Vertretungsplan</title>
<SCRIPT type="text/javascript">
function kurse_visibility() {
	visible = 1-visible;
	var sel = document.getElementById("jg");
	var val = sel.options[sel.selectedIndex].value;
	var code = val.charCodeAt(0);
	
	if (val == 12) {
		document.getElementById("12_table").style.display = "inline-table";
		document.getElementById("13_table").style.display = "none";
		document.getElementById("p_text").style.display = "none";
		document.getElementById("p_list").style.display = "none";
		document.getElementById("p_space").style.display = "none";
		document.getElementById("z_text").style.display = "none";
		document.getElementById("z_list").style.display = "none";
		document.getElementById("z_space").style.display = "none";
		document.getElementById("ep_text").style.display = "none";
		document.getElementById("ep_list").style.display = "none";
	} else if (val == 13) {
		document.getElementById("13_table").style.display = "inline-table";
		document.getElementById("12_table").style.display = "none";
		document.getElementById("p_text").style.display = "none";
		document.getElementById("p_list").style.display = "none";
		document.getElementById("p_space").style.display = "none";
		document.getElementById("z_text").style.display = "none";
		document.getElementById("z_list").style.display = "none";
		document.getElementById("z_space").style.display = "none";
		document.getElementById("ep_text").style.display = "none";
		document.getElementById("ep_list").style.display = "none";
	} else if (code == 69) {
		document.getElementById("12_table").style.display = "none";
		document.getElementById("13_table").style.display = "none";
		document.getElementById("p_text").style.display = "none";
		document.getElementById("p_list").style.display = "none";
		document.getElementById("p_space").style.display = "inline";
		document.getElementById("z_text").style.display = "none";
		document.getElementById("z_list").style.display = "none";
		document.getElementById("z_space").style.display = "none";
		document.getElementById("ep_text").style.display = "inline";
		document.getElementById("ep_list").style.display = "inline";
	} else {
		document.getElementById("12_table").style.display = "none";
		document.getElementById("13_table").style.display = "none";
		document.getElementById("p_text").style.display = "inline";
		document.getElementById("p_list").style.display = "inline";
		document.getElementById("p_space").style.display = "inline";
		document.getElementById("z_text").style.display = "inline";
		document.getElementById("z_list").style.display = "inline";
		document.getElementById("z_space").style.display = "inline";
		document.getElementById("ep_text").style.display = "none";
		document.getElementById("ep_list").style.display = "none";
	}
}
</SCRIPT>
<style>
* {
	font-family: Arial, Helvetica, sans-serif;
}
body {
	font-size: ' . $font_size . ';
}
input {
	font-size: ' . $input_font_size . ';
}
input[type="checkbox"] {
	width: 1.2em;
	height: 1.2em;
}
select {
	font-size: ' . $input_font_size . ';
}

.center{										// Alternative zu <div align="center">
	margin: auto;
	width: 50%;
}
span.tab{
    padding: 1em;
}
.Titel {}
.footnote {
	font-size: ' . $footnote_font_size . ';
}
.footer {
	font-size: ' . $footer_font_size . ';
}
</style>
</head>
<body>
<div align="center">
';

if ($debug) {
echo "REQUEST_URI=|" . $_SERVER["REQUEST_URI"] . "|<br> debug=|$debug|<br> QUERY_STRING=|" . $_SERVER["QUERY_STRING"] . "|<br>var_dump(\$_POST)=|";
var_dump($_POST);
echo "|<br>\$_SESSION['uinfo']=|" . $_SESSION['uinfo'] . "|<br>\$_SERVER['HTTP_USER_AGENT']=|" . $_SERVER['HTTP_USER_AGENT'] . "|<br>";
}

if (isset($_COOKIE['k']) && isset($_POST['submit']) && strcmp($_POST['submit'], $dc) == 0) {
	$flagg = 2;
}
if ($flagg == 0 && ($_SERVER["REQUEST_METHOD"] == "POST" || (isset($_COOKIE['k']) && strlen($_COOKIE['k']) > 0) )) {
	if (isset($_COOKIE['k']) && $_SERVER["REQUEST_METHOD"] != "POST") {		// Cookie-Check
		$value = htmlspecialchars_decode($_COOKIE['k']);
	} else {									// Konkatenation der Kursauswahl
		$jg = (isset($_POST['jg'])) ? $_POST['jg'] : "";
		$p = (isset($_POST['p'])) ? $_POST['p'] : "";
		$z = (isset($_POST['z'])) ? $_POST['z'] : "";
		$ep = "";
		
		$s = "(";
		$key = key($kurse_q);		
		if (array_key_exists($key,$_POST)) $s .= str_replace("_"," ",$key);
		next($kurse_q);
		while ($val = current($kurse_q)) {
			$key = key($kurse_q);
			if ($debug) {
				echo "\$key=|" . $key . "| -->";
				echo "array_key_exists=|" . array_key_exists($key,$_POST) . "|$br";
			}
			if (array_key_exists($key,$_POST) === TRUE) {
				$s .= "|" . str_replace("_"," ",$key);
			}
			next($kurse_q);
		}
		$s .= ")";
		
		if ($debug) {
			echo "\njg= ";
			var_dump($jg);
			printf("strlen=%d, jg=|", strlen($jg));
			for ($i=0; $i<strlen($jg); $i++)
				printf ("%d,", ord(substr($jg, $i, 1)));
			echo "|\np= "; var_dump($p);
		}
		
		if ($jg >= 12) {
			$value = $s;
		} else if (strncmp($jg, "EP ", 3) == 0) {
			$ep = (isset($_POST['ep'])) ? $_POST['ep'] : "";
			$value = $jg . $ep;
		} else {
			$value = $jg . $p .  $z;
		}
			setcookie('k', $value, time() + 2592000);					// Setzen eines Cookies
		}
	if ($debug) echo "\$value=|" . $value . "|\n";
	
	$br = "\n<tr><td>&nbsp;</td><td colspan=\"4\"></td></tr>\n";
	echo "<table>\n";
	
	$handle = fopen("$source_url", "r");								// Oeffnen des Vertretungsplans
	if ($handle) {
    		while (($buffer = fgets($handle, 4096)) !== false) {
			if (preg_match('/<HR>/', $buffer) == 1) {
				newlineif();
			}
			if (preg_match("/>(Vertretungsplan|Ersatzraumplan)/", $buffer) == 1) {
				newlineif();
				echo $buffer . $br;
				$l += 2;
			} else if (preg_match("/Titel.>$value</", $buffer) == 1) {	// Suche nach Klasse & Kursen
				$p = 1;
			} else if (preg_match("/Titel.>.+/", $buffer) == 1 && $p == 1) {
				newlineif();
			}
			if ( $p == 1 ) {
				echo $buffer;						// Ausdrucken der selektierten Zeile
				$l++;
			}
		}
	}
	fclose($handle);								// Schließen des Vertretungsplans
	
	while ($l++ <= 12) {
		echo $br;
	}
	echo "</table>\n<br>\n<div class=\"footer\">Aktualisiert am: " . date('j') . "." . date('m') . "." . date('y')
	. " " . date('H') . ":" . date('i') . "</div>";
	$value = str_replace(" ", "", $value);
	if (strpos($value, "(") !== false) {
			$temp = strpos($value, "(");
			$value = substr($value, 0, $temp);
	}
	echo "<div class=\"footer\">KEINE GEW&Auml;HR<br>\nJahrgangsstufe/Klasse: $value</div>\n";
	echo "<form method=\"post\" action=\"" . htmlspecialchars($_SERVER["REQUEST_URI"]) . "\">";
	echo "<input type=\"submit\" name=\"submit\" value=\"$dc\">";
	echo " <input type=\"button\" onClick=\"history.go(0)\" value=\"$rt\">\n</form>\n";
	echo "<br>\n<div class=\"footnote\">$footnote</div>\n<br>";		
} else {
	if (isset($_COOKIE['k'])) {
		if ($debug) echo "\$_COOKIE: " . $_COOKIE['k'] . "\n";
		$value_temp = htmlspecialchars_decode($_COOKIE['k']);
		$value = str_replace(" ", "_", $value_temp);
		if ($debug) echo "strpos($value, \"(\"): " . strpos($value, "(") . "\n";
		if (strpos($value_temp, "(") !== false) {
			$temp = strpos($value_temp, "(");
			$value_temp = substr($value, 0, $temp);
		}
		if (strstr($value_temp, "EP 0")) {
			$temp = str_replace("EP 0", "", $value_temp);
			$temp += 96;
			$temp = chr($temp);
			$value_temp = $value_temp . $temp;
		}
		if ($debug) echo "value=|$value|\tvalue_temp=|$value_temp|\n";
	} else {
		$value = "";
		$value_temp = 0;
	}
	
	echo "<h3>Vetretungsplan</h3>";	
	echo "<form method=\"post\" action=\"" . htmlspecialchars($_SERVER["REQUEST_URI"]) . "\">\n";
	
	echo "Klasse bzw. Jahrgangsstufe: <select id=jg name=jg onchange=\"kurse_visibility()\""
	 . "onblur= \"kurse_visibility()\" onselect=\"kurse_visibility()\">";
	while ($val = current($jg)) {
		$key = key($jg);
	 	echo "<option value=\"$key\"";
		if (strpos($value_temp, $key) !== false || strcmp($value_temp, $key) == 0) {
			echo " selected";
		}
		echo ">$val</option>\n";
		next($jg);
	}
	echo "</select>\n\n";
	
	if ($column > 2) {
		echo "<p id=\"p_space\"><span class=\"tab\"></span></p>";
	} else {
		echo "<p id=\"p_space\"><br>\n<br>\n</p>";
	}
	echo "<p id=\"p_text\">Parallel Klasse: </p><select id=\"p_list\" name=p>";
	while ($val = current($p)) {
		$key = key($p);
	 	echo "<option value=\"$key\"";
		if (strpos($value_temp, $key) !== false) {
			echo "selected";
		}
		echo ">$val</option>\n";
		next($p);
	}
	echo "</select>\n\n";
	echo "<p id=\"ep_text\">Parallel Klasse: </p><select id=\"ep_list\" name=ep>";
	while ($val = current($ep)) {
		$key = key($ep);
	 	echo "<option value=\"$key\"";
		if (strpos($value_temp, $key) !== false) {
			echo "selected";
		}
		echo ">$val</option>\n";
		next($ep);
	}
	echo "</select>\n\n";
	
	if ($column > 2) {
		echo "<p id=\"z_space\"><span class=\"tab\"></span></p>";
	} else {
		echo "<p id=\"z_space\"><br>\n<br>\n</p>";
	}
	echo "<p id=\"z_text\">Zweig: </p><select id=\"z_list\" name=z>";
	while ($val = current($z)) {
		$key = key($z);
	 	echo "<option value=\"$key\"";
		if (strpos($value_temp, $key) !== false) {
			echo "selected";
		}
		echo ">$val</option>\n";
		next($z);
	}
	echo "</select>\n\n";
	
	if ($column > 1) {
		echo "<span class=\"tab\"></span><input type=\"submit\" name=\"submit\" value=\"senden\"><br>\n";
	} else {
		echo "<br><input type=\"submit\" name=\"submit\" value=\"senden\"><br>\n";
	}
	if (strpos($_SESSION['uinfo'], "?m") !== False) echo "<br>\n";
	
	echo "\n<table id=\"12_table\">$br<tr><td>Kurse der Q1 und Q2: </td>" . $td . "</tr>\n<tr>";
	$n = 0;	
	$val = current($kurse_q);
	$temp_old = substr($val, 0, 3);
	while ($val = current($kurse_q)) {
		$key = key($kurse_q);
		$temp_new = substr($val, 0, 3);
		if ($nlfnc == 0 && strcmp($temp_old, $temp_new) != 0) {
			for (; $n < $column; $n++) echo "\n\t<td></td>";
			echo "$br$br";
			$n = 0;
		}
		$temp_old = substr($val, 0, 3);
				
		if ($n == $column) {
			echo "\n</tr>\n<tr>";
			$n = 0;
		}
		echo "\n\t<td><input type=\"checkbox\" name=\"$key\" value=\"$val\"";
		if (strpos($value, $key) !== false && $value_temp == 12) {
			echo "checked";
		}
		next($kurse_q);
		echo ">$val</td>";
		$n++;
	}
	for (; $n < $column; $n++) echo "\n\t<td></td>";
	echo "\n</tr>\n</table>\n";
		
	echo "\n<table id=\"13_table\">$br<tr><td>Kurse der Q3 und Q4: </td>" . $td . "</tr>\n<tr>";
	$n = 0;	
	$val = current($kurse_a);
	$temp_old = substr($val, 0, 3);
	while ($val = current($kurse_a)) {
		$key = key($kurse_a);
		$temp_new = substr($val, 0, 3);
		if ($nlfnc == 0 && strcmp($temp_old, $temp_new) != 0) {
			for (; $n < $column; $n++) echo "\n\t<td></td>";
			echo "$br$br";
			$n = 0;
		}
		$temp_old = substr($val, 0, 3);
				
		if ($n == $column) {
			echo "\n</tr>\n<tr>";
			$n = 0;
		}
		echo "\n\t<td><input type=\"checkbox\" name=\"$key\" value=\"$val\"";
		if (strpos($value, $key) !== false && $value_temp == 13) {
			echo "checked";
		}
		next($kurse_a);
		echo ">$val</td>";
		$n++;
	}
	for (; $n < $column; $n++) echo "\n\t<td></td>";
	
	echo "\n</tr>\n</table>\n</form>\n";
	echo "<br>\n<br>\n<div class=\"footnote\">\n$footnote</div>\n<br>";	
}


/* Variante mit Cookie und Redirect, bei der die Bildschirmaufloesung uebermittelt wird
if (isset($_COOKIE['uinfo'])) {									// Erzeugung von "User-Info"-Cookie
	$uinfo = htmlspecialchars_decode($_COOKIE['uinfo']);
} else if ($_SESSION['calls'] <= 5){
	echo '<SCRIPT type="text/javascript">';
	echo 'document.cookie = "uinfo = ?" + window.innerWidth + "?" + window.innerHeight + "?';
	if (strpos($_SERVER['HTTP_USER_AGENT'], "Windows") !== False) echo 'Windows';
	else if (strpos($_SERVER['HTTP_USER_AGENT'], "Linux") !== False && strpos($_SERVER['HTTP_USER_AGENT'], "Android") == 0) echo 'Linux';
	else echo 'm';
	echo '";location.reload(true);</SCRIPT>';
	$_SESSION['calls']++;
	$uinfo = "";	
}
if ($_SESSION['calls'] == 5) {
	echo "Bitte erlauben Sie Cookies auf dieser Website, damit diese gescheit dargestellt werden kann.";
}

Ich sollte hier noch den CSS für DIV align=denter ergänzen.
*/
?>

<SCRIPT type="text/javascript">
visible = 0;
kurse_visibility();
</SCRIPT>

</div>
</body>
</html>
