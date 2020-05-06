#!/usr/bin/expect -f

set vm_name [lindex $argv 0]
set vm_namespace [lindex $argv 1]
set hostname vm-example
set username fedora
set password fedora

set login_prompt "$hostname login: "
set password_prompt "Password: "
set prompt "$"

set response_delay 3
set timeout 10
set send_human {.1 .3 1 .05 2}

set source_path1 "/home/fedora/source1"
set source_path2 "/home/fedora/source2"
set source_path3 "/home/fedora/source3"

spawn virtctl console $vm_name -n $vm_namespace

send -h "\n"

sleep 1

send -h \004

# Enter username
expect $login_prompt {
    sleep $response_delay
    send -h "$username\n"
}

# Enter Password
expect $password_prompt {
    sleep $response_delay
    send -h "$password\n"
}

# Run tests
expect $prompt {
    sleep $response_delay

    send -h "mkdir ${source_path1} \n"
    send -h "mkdir ${source_path2} \n"
    send -h "mkdir ${source_path3} \n"

    # mount source 1
    send -h "sudo mount /dev/vdc ${source_path1} \n"

    # mount source 2
    send -h "sudo mount /dev/vdd ${source_path2} \n"

    # mount source 3
    send -h "sudo mount /dev/vde ${source_path3} \n"

    # Create readableFile func
    send -h "function _rf() { test -r \$1 && echo SUCCESS || echo FAILED; };\n"

    # Check if source1 files are readable
    send -h "_rf ${source_path1}/data1 \n";
    send -h "_rf ${source_path1}/data2 \n";
    send -h "_rf ${source_path1}/data3 \n";

    # Check if source2 files are readable
    send -h "_rf ${source_path2}/ca.crt \n";
    send -h "_rf ${source_path2}/namespace \n";
    send -h "_rf ${source_path2}/service-ca.crt \n";
    send -h "_rf ${source_path2}/token \n";

    # Check if source3 files are readable
    send -h "_rf ${source_path3}/ca.crt \n";
    send -h "_rf ${source_path3}/namespace \n";
    send -h "_rf ${source_path3}/service-ca.crt \n";
    send -h "_rf ${source_path3}/token \n";

}

# exit to login prompt
expect $prompt {
    send -h \004
    expect -re $login_prompt
}

# exit console
send \003]
