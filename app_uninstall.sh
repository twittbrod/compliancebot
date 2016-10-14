#! /usr/bin/env bash

echo Please provide the following details on your lab environment.
echo
echo "What is the address of your Mantl Control Server?  "
echo "eg: control.mantl.internet.com"
read control_address
echo
echo "What is the username for your Mantl account?  "
read mantl_user
echo
echo "What is the password for your Mantl account?  "
read -s mantl_password
echo
echo "What folder name do you want to use?"
read folder_name
echo
echo "What deployment name do you want to use?"
read deployment_name

echo "Uninstalling the compliancebot at $folder_name/$deployment_name"
curl -k -X DELETE -u $mantl_user:$mantl_password https://$control_address:8080/v2/apps/$folder_name/$deployment_name/compliancebot \
-H "Content-type: application/json"
echo

