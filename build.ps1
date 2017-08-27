# This file is for building and testing locally on Windows.
"#######################################"
"## How to build and test this add-on ##"
"#######################################"
""
"Opening Thunderbird add-on folder..."
$a = $env:APPDATA
$b = (Get-ChildItem $a\Thunderbird\Profiles).Name
if ( [string]::IsNullOrEmpty($a) -And [string]::IsNullOrEmpty($b) ) {
	"  cloudn't detect your Thunderbird Profiles. Please install Thunderbird app and ReFwdFormatter add-on on Windows. Then, check the following folder: "
	"    $a\Thunderbird\Profiles\$b\extensions\  "
	exit
}
"  opened."
""
"Opening src folder..."
invoke-item "src"
"  opened."
""
"Opening bin folder..."
invoke-item "bin"
"  opened."
""
""
"1. Please manually Zip src folder's content (without folder itself) to bin\refwdformatter-<newversion>.xpi"
""
"2. Then update Thunderbird add-on folder's refwdformatter@masahiko.info.xpi file by bin\refwdformatter-<newversion>.xpi."
"    Or, install add-on from bin\refwdformatter-<newversion>.xpi file."
"           -> https://support.mozilla.org/en-US/kb/thunderbird-add-ons-frequently-asked-questions#w_installing-add-ons-from-within-thunderbird "
""
"3. If you would like to develop this add-on, please UnZip Thunderbird add-on folder's refwdformatter@masahiko.info.xpi file to the same folder."
"    And remove refwdformatter@masahiko.info.xpi file temporally."
""