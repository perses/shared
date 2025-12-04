#!/bin/bash

# =============================================================================
# link-with-perses.sh
# =============================================================================
# This script manages file-based npm dependencies between this project (shared)
# and an external project (e.g., perses). It allows developers to link local
# workspace packages as file dependencies for local development.
#
# Usage:
#   ./link-with-perses.sh <command> [options]
#
# Commands:
#   link      - Install workspace packages as file references in the external project
#   unlink    - Restore original npm package versions in the external project
#   status    - Show current link status of workspace packages
#
# Options:
#   -p, --path <path>   Path to the perses repository root (default: ../perses)
#                       The app is expected at <path>/ui/app
#   -h, --help          Show this help message
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the root of the shared project (two levels up from scripts/link-with-perses/)
SHARED_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default perses repository root (sibling directory)
DEFAULT_PERSES_ROOT="$(cd "$SHARED_ROOT/.." && pwd)/perses"

# Relative path from perses root to the app
APP_RELATIVE_PATH="ui/app"

# Workspace packages defined in this project
WORKSPACE_PACKAGES=(
    "@perses-dev/components:components"
    "@perses-dev/dashboards:dashboards"
    "@perses-dev/plugin-system:plugin-system"
    "@perses-dev/explore:explore"
)

# Backup file for storing original versions
BACKUP_FILE=".perses-shared-link-bk.json"
BACKUP_LOCK_FILE=".perses-shared-link-lock-bk.json"

# =============================================================================
# Helper Functions
# =============================================================================

print_help() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  link      Install workspace packages as file references in the perses app"
    echo "  unlink    Restore original npm package versions in the perses app"
    echo "  status    Show current link status of workspace packages"
    echo ""
    echo "Options:"
    echo "  -p, --path <path>   Path to the perses repository root (default: ../perses)"
    echo "                      The app is expected at <path>/$APP_RELATIVE_PATH"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 link                          # Link with default perses at ../perses"
    echo "  $0 link -p ~/projects/perses     # Link with custom perses location"
    echo "  $0 unlink                        # Unlink and restore original versions"
    echo "  $0 status                        # Check current link status"
}

log_warning() {
    printf "${YELLOW}[WARNING]${NC} %s\n" "$1"
}

log_error() {
    printf "${RED}[ERROR]${NC} %s\n" "$1"
}

# Check if jq is available
check_jq() {
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install it:"
        echo "  macOS: brew install jq"
        echo "  Ubuntu: sudo apt-get install jq"
        exit 1
    fi
}

# Get package name from workspace entry
get_package_name() {
    echo "$1" | cut -d':' -f1
}

# Get package folder from workspace entry
get_package_folder() {
    echo "$1" | cut -d':' -f2
}

# Check if a package exists in the external project's package.json
package_exists_in_external() {
    local package_name="$1"
    local external_package_json="$2"
    
    if jq -e ".dependencies[\"$package_name\"] // .devDependencies[\"$package_name\"]" "$external_package_json" > /dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Get current version of a package in external project
get_current_version() {
    local package_name="$1"
    local external_package_json="$2"
    
    local version=$(jq -r ".dependencies[\"$package_name\"] // .devDependencies[\"$package_name\"] // empty" "$external_package_json")
    echo "$version"
}

# Check if a package is currently linked (file: reference)
is_linked() {
    local version="$1"
    if [[ "$version" == file:* ]]; then
        return 0
    fi
    return 1
}

# Check if a workspace package is built (has dist folder)
is_built() {
    local package_folder="$1"
    local dist_path="$SHARED_ROOT/$package_folder/dist"
    if [[ -d "$dist_path" ]]; then
        return 0
    fi
    return 1
}

# Build workspaces that are not built
build_if_needed() {
    local needs_build=false
    
    for workspace in "${WORKSPACE_PACKAGES[@]}"; do
        local package_folder=$(get_package_folder "$workspace")
        if ! is_built "$package_folder"; then
            needs_build=true
            break
        fi
    done
    
    if [[ "$needs_build" == true ]]; then
        echo "Building shared packages..."
        if (cd "$SHARED_ROOT" && npm run build --silent 2>/dev/null); then
            printf "  ${GREEN}Build complete${NC}\n"
        else
            log_error "Build failed. Please run 'npm run build' manually."
            exit 1
        fi
    fi
}

# =============================================================================
# Status Command
# =============================================================================

show_status() {
    local perses_root="$1"
    local app_path="$perses_root/$APP_RELATIVE_PATH"
    local external_package_json="$app_path/package.json"
    
    if [[ ! -f "$external_package_json" ]]; then
        log_error "package.json not found at: $external_package_json"
        exit 1
    fi
    
    local linked_count=0
    local total_count=0
    
    echo ""
    echo "Status ($app_path):"
    
    for workspace in "${WORKSPACE_PACKAGES[@]}"; do
        local package_name=$(get_package_name "$workspace")
        local package_folder=$(get_package_folder "$workspace")
        
        if package_exists_in_external "$package_name" "$external_package_json"; then
            ((total_count++))
            local current_version=$(get_current_version "$package_name" "$external_package_json")
            
            if is_linked "$current_version"; then
                ((linked_count++))
                if is_built "$package_folder"; then
                    printf "  ${GREEN}●${NC} %s ${GREEN}linked${NC}\n" "$package_name"
                else
                    printf "  ${YELLOW}●${NC} %s ${YELLOW}linked (not built)${NC}\n" "$package_name"
                fi
            else
                printf "  ${YELLOW}○${NC} %s (%s)\n" "$package_name" "$current_version"
            fi
        else
            printf "  ${RED}✗${NC} %s (not in project)\n" "$package_name"
        fi
    done
    
    echo ""
    echo "$linked_count of $total_count packages linked"
}

# =============================================================================
# Link Command
# =============================================================================

do_link() {
    local perses_root="$1"
    local app_path="$perses_root/$APP_RELATIVE_PATH"
    local ui_path="$perses_root/ui"
    local external_package_json="$app_path/package.json"
    local external_package_lock="$ui_path/package-lock.json"
    local backup_path="$app_path/$BACKUP_FILE"
    local backup_lock_path="$ui_path/$BACKUP_LOCK_FILE"
    
    if [[ ! -f "$external_package_json" ]]; then
        log_error "package.json not found at: $external_package_json"
        exit 1
    fi
    
    # Build shared packages if not already built
    build_if_needed
    
    # Backup package-lock.json if it exists and backup doesn't
    if [[ -f "$external_package_lock" && ! -f "$backup_lock_path" ]]; then
        cp "$external_package_lock" "$backup_lock_path"
    fi
    
    # Create backup of original versions if it doesn't exist
    if [[ ! -f "$backup_path" ]]; then
        echo "{}" > "$backup_path"
        for workspace in "${WORKSPACE_PACKAGES[@]}"; do
            local package_name=$(get_package_name "$workspace")
            if package_exists_in_external "$package_name" "$external_package_json"; then
                local current_version=$(get_current_version "$package_name" "$external_package_json")
                if ! is_linked "$current_version"; then
                    local tmp=$(mktemp)
                    jq ". + {\"$package_name\": \"$current_version\"}" "$backup_path" > "$tmp" && mv "$tmp" "$backup_path"
                fi
            fi
        done
    fi
    
    # Link each workspace package
    local already_linked=0
    
    echo "Linking packages to $app_path..."
    
    for workspace in "${WORKSPACE_PACKAGES[@]}"; do
        local package_name=$(get_package_name "$workspace")
        local package_folder=$(get_package_folder "$workspace")
        local package_path="$SHARED_ROOT/$package_folder"
        
        if package_exists_in_external "$package_name" "$external_package_json"; then
            local current_version=$(get_current_version "$package_name" "$external_package_json")
            
            if is_linked "$current_version"; then
                ((already_linked++))
                continue
            fi
            
            echo -n "  Linking $package_name... "
            
            if (cd "$ui_path" && npm install "file:$package_path" --save -w app --silent 2>/dev/null); then
                printf "${GREEN}done${NC}\n"
            else
                printf "${RED}failed${NC}\n"
            fi
        fi
    done
    
    if [[ $already_linked -gt 0 ]]; then
        echo "  ($already_linked package(s) already linked)"
    fi
    
    # Show status
    show_status "$perses_root"
    
    # Show next steps
    printf "\nNow you can start the app dev server, in shared mode, from Perses:\n\ncd %s\nnpm run start:shared\n" "$app_path"
}

# =============================================================================
# Unlink Command
# =============================================================================

do_unlink() {
    local perses_root="$1"
    local app_path="$perses_root/$APP_RELATIVE_PATH"
    local ui_path="$perses_root/ui"
    local external_package_json="$app_path/package.json"
    local external_package_lock="$ui_path/package-lock.json"
    local backup_path="$app_path/$BACKUP_FILE"
    local backup_lock_path="$ui_path/$BACKUP_LOCK_FILE"
    
    if [[ ! -f "$external_package_json" ]]; then
        log_error "package.json not found at: $external_package_json"
        exit 1
    fi
    
    if [[ ! -f "$backup_path" ]]; then
        log_error "No backup file found. Cannot restore original versions."
        echo "  Manually restore: cd $app_path && npm install @perses-dev/components@<version> ..."
        exit 1
    fi
    
    # Check if backup file is empty or has no entries
    local backup_count=$(jq 'keys | length' "$backup_path" 2>/dev/null)
    if [[ -z "$backup_count" || "$backup_count" -eq 0 ]]; then
        log_error "Backup file is empty. Cannot restore original versions."
        echo "  Manually restore: cd $app_path && npm install @perses-dev/components@<version> ..."
        echo "  Or: rm $backup_path && cd $app_path && npm install"
        exit 1
    fi
    
    local unlinked_any=false
    local missing_backups=()
    
    echo "Unlinking packages..."
    
    for workspace in "${WORKSPACE_PACKAGES[@]}"; do
        local package_name=$(get_package_name "$workspace")
        
        if package_exists_in_external "$package_name" "$external_package_json"; then
            local current_version=$(get_current_version "$package_name" "$external_package_json")
            
            if ! is_linked "$current_version"; then
                continue
            fi
            
            local original_version=$(jq -r ".[\"$package_name\"] // empty" "$backup_path")
            
            if [[ -z "$original_version" ]]; then
                missing_backups+=("$package_name")
                continue
            fi
            
            echo -n "  Restoring $package_name@$original_version... "
            
            # Update package.json directly using jq instead of npm install
            local tmp=$(mktemp)
            if jq ".dependencies[\"$package_name\"] = \"$original_version\"" "$external_package_json" > "$tmp" 2>/dev/null; then
                mv "$tmp" "$external_package_json"
                printf "${GREEN}done${NC}\n"
                unlinked_any=true
            else
                rm -f "$tmp"
                printf "${RED}failed${NC}\n"
            fi
        fi
    done
    
    # Check if all packages are unlinked, then restore lockfile and run npm install
    if [[ "$unlinked_any" == true ]]; then
        local all_unlinked=true
        for workspace in "${WORKSPACE_PACKAGES[@]}"; do
            local package_name=$(get_package_name "$workspace")
            if package_exists_in_external "$package_name" "$external_package_json"; then
                local current_version=$(get_current_version "$package_name" "$external_package_json")
                if is_linked "$current_version"; then
                    all_unlinked=false
                    break
                fi
            fi
        done
        
        if [[ "$all_unlinked" == true ]]; then
            rm -f "$backup_path"
            # Restore package-lock.json if backup exists and run npm install from ui root
            if [[ -f "$backup_lock_path" ]]; then
                echo "  Restoring package-lock.json..."
                cp "$backup_lock_path" "$external_package_lock"
                rm -f "$backup_lock_path"
            fi
            echo "  Running npm install from workspace root..."
            (cd "$ui_path" && npm install --silent 2>/dev/null)
        fi
    fi
    
    # Show warning for packages with missing backups
    if [[ ${#missing_backups[@]} -gt 0 ]]; then
        echo ""
        log_warning "Missing backup for: ${missing_backups[*]}"
        echo "  Manually restore: cd $app_path && npm install <package>@<version>"
    fi
    
    # Show status
    show_status "$perses_root"
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    check_jq
    
    local command=""
    local perses_root="$DEFAULT_PERSES_ROOT"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            link|unlink|status)
                command="$1"
                shift
                ;;
            -p|--path)
                if [[ -n "$2" && ! "$2" =~ ^- ]]; then
                    perses_root="$2"
                    shift 2
                else
                    log_error "Option -p requires a path argument"
                    exit 1
                fi
                ;;
            -h|--help)
                print_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                print_help
                exit 1
                ;;
        esac
    done
    
    # Resolve to absolute path
    if [[ ! "$perses_root" = /* ]]; then
        perses_root="$(cd "$SHARED_ROOT" && cd "$perses_root" 2>/dev/null && pwd)" || {
            log_error "Cannot resolve path: $perses_root"
            exit 1
        }
    fi
    
    # Check if perses root exists
    if [[ ! -d "$perses_root" ]]; then
        log_error "Perses repository not found at: $perses_root"
        exit 1
    fi
    
    # Check if app directory exists
    local app_path="$perses_root/$APP_RELATIVE_PATH"
    if [[ ! -d "$app_path" ]]; then
        log_error "Perses app directory not found at: $app_path"
        log_error "Make sure the perses repository has the expected structure."
        exit 1
    fi
    
    # Execute command (default to 'link' if no command specified)
    case "$command" in
        link|"")
            do_link "$perses_root"
            ;;
        unlink)
            do_unlink "$perses_root"
            ;;
        status)
            show_status "$perses_root"
            ;;
        *)
            log_error "Unknown command: $command"
            print_help
            exit 1
            ;;
    esac
}

main "$@"
