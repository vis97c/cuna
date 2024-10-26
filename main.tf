variable "PROJECT_NAME" {
  type     = string
  nullable = false
}
variable "PROJECT_ID" {
  type     = string
  nullable = false
}
variable "PROJECT_REGION" {
  type     = string
  nullable = false
}
variable "PROJECT_BILLING_ACCOUNT" {
  type     = string
  nullable = true
}


# Terraform configuration to set up providers by version.
terraform {
  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.0"
    }
  }
}

# Configures the provider to use the resource block's specified project for quota checks.
provider "google-beta" {
  user_project_override = true
}

# Configures the provider to not use the resource block's specified project for quota checks.
# This provider should only be used during project creation and initializing services.
provider "google-beta" {
  alias                 = "no_user_project_override"
  user_project_override = false
}

import {
  to = google_project.default
  id = "projects/${var.PROJECT_ID}"
}

# Creates a new Google Cloud project.
resource "google_project" "default" {
  provider        = google-beta.no_user_project_override
  name            = var.PROJECT_NAME
  project_id      = var.PROJECT_ID
  billing_account = var.PROJECT_BILLING_ACCOUNT
  labels = {
    firebase = "enabled"
  }
  auto_create_network = true
}

# Enables required APIs.
resource "google_project_service" "default" {
  provider = google-beta.no_user_project_override
  project  = var.PROJECT_ID

  for_each = toset([
    "cloudbilling.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "firebase.googleapis.com",
    "firebasestorage.googleapis.com",
    "identitytoolkit.googleapis.com",
    "recaptchaenterprise.googleapis.com",
    "firebaserules.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "cloudapis.googleapis.com",
    "cloudfunctions.googleapis.com",
    "firebasehosting.googleapis.com",
    "datastore.googleapis.com",
    "firebaseappcheck.googleapis.com",
    "storage-component.googleapis.com",
    "serviceusage.googleapis.com", # Enabling the ServiceUsage API allows the new project to be quota checked from now on.
  ])
  service = each.key

  # Don't disable the service if the resource block is removed by accident.
  disable_on_destroy = false
}

# Enables Firebase services for the new project created above.
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.PROJECT_ID

  # Waits for the required APIs to be enabled.
  depends_on = [
    google_project_service.default
  ]
}

import {
  to = google_identity_platform_config.default
  id = "projects/${var.PROJECT_ID}/config"
}

# Creates an Identity Platform config.
# Also enables Firebase Authentication with Identity Platform in the project if not.
resource "google_identity_platform_config" "default" {
  provider = google-beta
  project  = var.PROJECT_ID

  # Auto-deletes anonymous users
  autodelete_anonymous_users = true

  # Configures local sign-in methods, like anonymous, email/password, and phone authentication.
  sign_in {
    allow_duplicate_emails = false

    anonymous {
      enabled = true
    }
    email {
      enabled           = true
      password_required = true
    }
  }

  # Configures a temporary quota for new signups for anonymous, email/password, and phone number.
  quota {
    sign_up_quota_config {
      quota          = 1000
      start_time     = timeadd(timestamp(), "5m")
      quota_duration = "7200s"
    }
  }

  # Configures authorized domains.
  authorized_domains = [
    "localhost",
    "${var.PROJECT_ID}.firebaseapp.com",
    "${var.PROJECT_ID}.web.app",
  ]

  # Wait for identitytoolkit.googleapis.com to be enabled before initializing Authentication.
  depends_on = [
    google_project_service.default,
  ]
}

# Creates a Firebase Web App in the new project created above.
resource "google_firebase_web_app" "default" {
  provider = google-beta
  project  = var.PROJECT_ID

  display_name = "${var.PROJECT_NAME} web app"

  # The other App types (Android and Apple) use "DELETE" by default.
  # Web apps don't use "DELETE" by default due to backward-compatibility.
  deletion_policy = "DELETE"

  # Wait for Firebase to be enabled in the Google Cloud project before creating this App.
  depends_on = [
    google_firebase_project.default,
  ]
}

import {
  to = google_firestore_database.default
  id = "projects/${var.PROJECT_ID}/databases/(default)"
}


# Provisions the Firestore database instance.
resource "google_firestore_database" "default" {
  provider = google-beta
  project  = var.PROJECT_ID

  name = "(default)"
  # See available locations: https://firebase.default.com/docs/projects/locations#default-cloud-location
  location_id = var.PROJECT_REGION
  # "FIRESTORE_NATIVE" is required to use Firestore with Firebase SDKs, authentication, and Firebase Security Rules.
  type                        = "FIRESTORE_NATIVE"
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"
  delete_protection_state     = "DELETE_PROTECTION_ENABLED"

  # Wait for Firebase to be enabled in the Google Cloud project before initializing Firestore.
  depends_on = [
    google_firebase_project.default,
  ]
}

# Provisions the default Cloud Storage bucket for the project via Google App Engine.
resource "google_app_engine_application" "default" {
  provider = google-beta
  project  = var.PROJECT_ID

  # See available locations: https://firebase.default.com/docs/projects/locations#default-cloud-location
  # This will set the location for the default Storage bucket and the App Engine App.
  location_id = var.PROJECT_REGION

  # If you use Firestore, uncomment this to make sure Firestore is provisioned first.
  depends_on = [
    google_firestore_database.default
  ]
}
