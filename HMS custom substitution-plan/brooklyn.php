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
	else if (strpos($_SERVER['HTTP_USER_AGENT'], "OS X") !== False && preg_match("OS \d", $_SERVER['HTTP_USER_AGENT']) != 1) $_SESSION['uinfo'] = '?desktop';
	else if (strpos($_SERVER['HTTP_USER_AGENT'], "Linux") !== False && strpos($_SERVER['HTTP_USER_AGENT'], "Android") === False) $_SESSION['uinfo'] = '?Linux';
	else $_SESSION['uinfo'] = '?m';
}
if (strpos($_SERVER["QUERY_STRING"], "iframe") !== false) $_SESSION['uinfo'] = '?iframe';	// iFrame-mode

/* Default-Werte, die im weiteren Verlauf geaender werden koennen */
$source_url = "/tmp/v-l.html";							// Pfad zum Vertretungsplan
$footnote = "Erdacht, erstellt und gepflegt von Gordian&nbsp;Edenhofer.";		// Fussnote mit Namensnennung
$dc = "Auswahl anpassen";								// "Cookie-Loeschen"-Text
$rt = "Neu Laden";									// "Seite neu laden"-Text
$font_size = 100;									// Schriftgroesse in %
$input_font_size = 80;

if (strpos($_SESSION['uinfo'], "?m") !== False) {					// Einstellungen fuer die mobile Version
	$font_size = "3em";
	$input_font_size = "0.8em";
	$footer_font_size = "0.55em";
	$footnote_font_size = "0.75em";
} else if (strpos($_SESSION['uinfo'], "?desktop") !== False || strpos($_SESSION['uinfo'], "?Linux") !== False) {	// Desktop Version
	$font_size = "1em";
	$input_font_size = "0.8em";
	$footer_font_size = "0.9em";
	$footnote_font_size = "0.75em";
} else if (strpos($_SESSION['uinfo'], "?iframe") !== False) {				// iFrame-Version
	$font_size = "1em";
	$input_font_size = "0.8em";
	$footer_font_size = "0.9em";
	$footnote_font_size = "0.75em";
}


$p = 0;											// "$p": "Druckvariabel"
$l = 0;											// "$l": Anzahl der Zeilen
$flagg = 0;										// Markierung
$buffer = "";
$buffer_p = "";
$buffer_o = "";
$i = 0;											// Zaehler & Flagge
$n = 0;											// Zaehler & Flagge
$ybe = 0;										// Yellow Block Exists
$br = "\n<tr><td>&nbsp;</td><td colspan=\"4\"></td></tr>\n";


function newlineif() {
	global $p, $l, $i, $br;
	if ($i != 0) {
		echo "</table>\n\n<table>\n";
		$i = 0;
	} else if ($p == 1) {
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
function visibility() {
			'; /* Still incomplete
			var sel = document.getElementById("ft");
			var val = sel.options[sel.selectedIndex].value;
			*/ echo '	
	document.getElementById("fehlende_lehrer_1").style.display = "none";	
	document.getElementById("fehlende_klassen_1").style.display = "none";
	document.getElementById("fehlende_raeume_1").style.display = "none";
	document.getElementById("fehlende_lehrer_2").style.display = "none";
	document.getElementById("fehlende_klassen_2").style.display = "none";
	document.getElementById("fehlende_raeume_2").style.display = "none";
	document.getElementById("yellow_block_1").style.display = "inline";
	document.getElementById("yellow_block_2").style.display = "inline";
}
</SCRIPT>

<style>
* {
	font-family: Arial, Helvetica, sans-serif;
}
body {
	font-size: ' . $font_size . ';
	text-align: center;
}
input {
	font-size: ' . $input_font_size . ';
}

.center{
	text-align: center;
}
.left{
	text-align: left;
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

if (isset($_COOKIE['l']) && isset($_POST['submit']) && strcmp($_POST['submit'], $dc) == 0) $flagg = 2;
if ($flagg == 0 && ($_SERVER["REQUEST_METHOD"] == "POST" || (isset($_COOKIE['l']) && strlen($_COOKIE['l']) > 0) )) {
	if (isset($_COOKIE['l']) && $_SERVER["REQUEST_METHOD"] != "POST") {		// Cookie-Check
		$value = $_COOKIE['l'];
	} else {									// Konkatenation der Kursauswahl
		$value = (isset($_POST['lehrer'])) ? htmlentities($_POST['lehrer']) : "";
		if ($debug) echo "\$_POST['lehrer']: " . $_POST['lehrer'] . "\n";
		setcookie("l", $value, time() + 2592000);				// Setzen eines Cookies "k"
	}
	echo "<table>\n";
	
	$handle = fopen("$source_url", "r");						// Oeffnen des Vertretungsplans
	if ($handle) {
    		while (($buffer = fgets($handle, 4096)) !== false) {
			if (preg_match('/<HR>/', $buffer) == 1) {
				newlineif();
			}
			if (preg_match("/<DIV CLASS=\"Zwei\">$value/", $buffer) == 1) {
				echo "</table>\n\n<table id=\"yellow_block";
				if ($n == 0) {
					echo "_1\">\n";
				} else if ($n == 1) {
					echo "_2\">\n";
				}				
				echo "$buffer_o$buffer_p";
				$ybe++;
				$p = 1;
				$i = 1;
			} else if (preg_match("/<\/TR>/", $buffer) == 1 && $i == 1 && $p == 1) {
				echo "</TR>";
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
			$buffer_o = $buffer_p;
			$buffer_p = $buffer;
			
			if (preg_match("/fehlende Lehrer:/", $buffer) == 1) {
				echo "</table>\n\n<table id=\"fehlende_lehrer";
				if ($n == 0) {
					echo "_1\">\n";
				} else if ($n == 1) {
					echo "_2\">\n";
				}
				echo "<TR><TH COLSPAN=2><DIV CLASS=\"Titel\">Fehlende Lehrer:</DIV></TH></TR>";
				$p = 1;
				$i = 2;
			} else if (preg_match("/fehlende Klassen:/", $buffer) == 1) {
				echo "</table>\n\n<table id=\"fehlende_klassen";
				if ($n == 0) {
					echo "_1\">\n";
				} else if ($n == 1) {
					echo "_2\">\n";
				}
				echo "<TR><TH COLSPAN=2><DIV CLASS=\"Titel\">Fehlende Klassen:</DIV></TH></TR>";
				$p = 1;
				$i = 3;
			} else if (preg_match("/fehlende R&auml;ume:/", $buffer) == 1) {
				echo "</table>\n\n<table id=\"fehlende_raeume";
				if ($n == 0) {
					echo "_1\">\n";
				} else if ($n == 1) {
					echo "_2\">\n";
				}				
				echo "<TR><TH COLSPAN=2><DIV CLASS=\"Titel\">Fehlende R&auml;ume:</DIV></TH></TR>";
				$p = 1;
				$i = 4;
				$n = 1;
			}
		}
	}
	fclose($handle);								// Schließen des Vertretungsplans
	
	while ($l++ <= 12) {
		echo $br;
	}
	
	echo "</table>\n<div class=\"footer\">Aktualisiert am: " . date('j') . "." . date('m') . "." . date('y')
	. " " . date('H') . ":" . date('i') . "</div>";		
	echo "<div class=\"footer\">" . $value . "<br>\nKEINE GEW&Auml;HR\n</div>\n";
	echo "<form method=\"post\" action=\"" . htmlspecialchars($_SERVER["REQUEST_URI"]) . "\">";
	echo "<input type=\"submit\" name=\"submit\" value=\"$dc\">";
	echo " <input type=\"button\" onClick=\"history.go(0)\" value=\"$rt\">\n</form>\n";
	echo "<br>\n<div class=\"footnote\">$footnote</div>\n<br>";
	
	while ($ybe++ < 2) echo "\n<table id=\"yellow_block_" . $ybe . "\"></table>";		
} else {
	if (isset($_COOKIE['l'])) {
		if ($debug) echo "\$_COOKIE: " . $_COOKIE['l'] . "\n";
		$value = htmlspecialchars_decode($_COOKIE['l']);
		if ($debug) echo "value=|$value|\n";
	} else $value = "";
	
	echo "<h3>Vetretungsplan</h3>";	
	echo "<form method=\"post\" action=\"" . htmlspecialchars($_SERVER["REQUEST_URI"]) . "\">\n";	
	echo "Ihr Nachname: <input type=\"text\" name=\"lehrer\" value=\"" . $value . "\">\n";	
	echo "<span class=\"tab\"></span><input type=\"submit\" name=\"submit\" value=\"senden\">\n</form><br>\n";
	echo "<br>\n<br>\n<div class=\"footnote\">\n$footnote</div>\n<br>";	
}
?>

<SCRIPT type="text/javascript">
visibility();
</SCRIPT>

</div>
</body>
</html>
