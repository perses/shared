#!/bin/bash

# =============================================================================
# link-with-perses.sh
# =============================================================================
# This script manages file-based npm dependencies between this project (shared)
# and external projects (perses or plugins). It allows developers to link local
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
# Target Options (mutually exclusive):
#   --perses [path]     Link to perses/ui/app (default: ../perses)
#   --plugins [path]    Link to plugins root (default: ../plugins)
#
# Other Options:
#   -h, --help          Show this help message
#   -d, --debug         Show detailed error output when commands fail
#
# If no target is specified, defaults to --perses for backward compatibility.
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

# Parent directory for sibling projects
PARENT_DIR="$(cd "$SHARED_ROOT/.." && pwd)"

# Default paths for each target
DEFAULT_PERSES_ROOT="$PARENT_DIR/perses"
DEFAULT_PLUGINS_ROOT="$PARENT_DIR/plugins"

# Target mode: "perses" (default) or "plugins"
TARGET_MODE="perses"

# Target-specific configuration (set by configure_target_mode)
PACKAGE_JSON_RELATIVE_PATH=""
LOCK_RELATIVE_PATH=""
WORKSPACE_FLAG=""
DEP_SECTION=""
BACKUP_FILE=""
BACKUP_LOCK_FILE=""

# Workspace packages defined in this project
WORKSPACE_PACKAGES=(
    "@perses-dev/components:components"
    "@perses-dev/dashboards:dashboards"
    "@perses-dev/plugin-system:plugin-system"
    "@perses-dev/explore:explore"
)

# Debug flag (set via --debug flag)
DEBUG=false

# =============================================================================
# Target Configuration
# =============================================================================

# Configure paths and settings based on target mode
configure_target_mode() {
    case "$TARGET_MODE" in
        perses)
            PACKAGE_JSON_RELATIVE_PATH="ui/app"
            LOCK_RELATIVE_PATH="ui"
            WORKSPACE_FLAG="-w app"
            DEP_SECTION="dependencies"
            BACKUP_FILE=".perses-shared-link-bk.json"
            BACKUP_LOCK_FILE=".perses-shared-link-lock-bk.json"
            ;;
        plugins)
            PACKAGE_JSON_RELATIVE_PATH="."
            LOCK_RELATIVE_PATH="."
            WORKSPACE_FLAG=""
            DEP_SECTION="devDependencies"
            BACKUP_FILE=".plugins-shared-link-bk.json"
            BACKUP_LOCK_FILE=".plugins-shared-link-lock-bk.json"
            ;;
    esac
}

# =============================================================================
# Helper Functions
# =============================================================================

print_help() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  link      Install workspace packages as file references in the target project"
    echo "  unlink    Restore original npm package versions in the target project"
    echo "  status    Show current link status of workspace packages"
    echo ""
    echo "Target Options (mutually exclusive):"
    echo "  -p, --perses [path] Link to perses/ui/app (default: ../perses)"
    echo "  --plugins [path]    Link to plugins root (default: ../plugins)"
    echo ""
    echo "Other Options:"
    echo "  -d, --debug         Show detailed error output when commands fail"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "If no target is specified, defaults to --perses for backward compatibility."
    echo ""
    echo "Examples:"
    echo "  $0 link                              # Link with perses at ../perses (default)"
    echo "  $0 link --perses                     # Same as above, explicit"
    echo "  $0 link --perses ~/projects/perses   # Link with custom perses location"
    echo "  $0 link --plugins                    # Link with plugins at ../plugins"
    echo "  $0 link --plugins ~/projects/plugins # Link with custom plugins location"
    echo "  $0 unlink                            # Unlink perses (default)"
    echo "  $0 unlink --plugins                  # Unlink plugins"
    echo "  $0 status --plugins                  # Check plugins link status"
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
# Prioritizes the target's dependency section based on DEP_SECTION
get_current_version() {
    local package_name="$1"
    local external_package_json="$2"
    
    local version
    if [[ "$DEP_SECTION" == "devDependencies" ]]; then
        version=$(jq -r ".devDependencies[\"$package_name\"] // .dependencies[\"$package_name\"] // empty" "$external_package_json")
    else
        version=$(jq -r ".dependencies[\"$package_name\"] // .devDependencies[\"$package_name\"] // empty" "$external_package_json")
    fi
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

# Convert Git Bash path to Windows path for npm on Windows
convert_path_for_npm() {
    local path="$1"
    
    # Check if we're on Windows (Git Bash/MSYS/MinGW)
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Convert /c/Users/... to C:/Users/...
        if [[ "$path" =~ ^/([a-z])/ ]]; then
            local drive_letter="${BASH_REMATCH[1]}"
            path="${drive_letter^^}:${path:2}"
        fi
    fi
    
    echo "$path"
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
    local target_root="$1"
    local package_json_path="$target_root"
    if [[ "$PACKAGE_JSON_RELATIVE_PATH" != "." ]]; then
        package_json_path="$target_root/$PACKAGE_JSON_RELATIVE_PATH"
    fi
    local external_package_json="$package_json_path/package.json"
    
    if [[ ! -f "$external_package_json" ]]; then
        log_error "package.json not found at: $external_package_json"
        exit 1
    fi
    
    local linked_count=0
    local total_count=0
    
    echo ""
    echo "Status ($package_json_path) [target: $TARGET_MODE]:"
    
    for workspace in "${WORKSPACE_PACKAGES[@]}"; do
        local package_name=$(get_package_name "$workspace")
        local package_folder=$(get_package_folder "$workspace")
        
        if package_exists_in_external "$package_name" "$external_package_json"; then
            ((total_count++)) || true
            local current_version=$(get_current_version "$package_name" "$external_package_json")
            
            if is_linked "$current_version"; then
                ((linked_count++)) || true
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
    local target_root="$1"
    local package_json_path="$target_root"
    if [[ "$PACKAGE_JSON_RELATIVE_PATH" != "." ]]; then
        package_json_path="$target_root/$PACKAGE_JSON_RELATIVE_PATH"
    fi
    local lock_path="$target_root"
    if [[ "$LOCK_RELATIVE_PATH" != "." ]]; then
        lock_path="$target_root/$LOCK_RELATIVE_PATH"
    fi
    local external_package_json="$package_json_path/package.json"
    local external_package_lock="$lock_path/package-lock.json"
    local backup_path="$package_json_path/$BACKUP_FILE"
    local backup_lock_path="$lock_path/$BACKUP_LOCK_FILE"
    
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

    echo "Linking packages to $package_json_path [$TARGET_MODE]..."
    
    # Temporarily disable exit on error to handle npm install failures gracefully.
    # npm install may fail (non-zero exit code) but still succeed in linking the package.
    # This allows us to check the actual result and continue trying other packages.
    set +e
    for workspace in "${WORKSPACE_PACKAGES[@]}"; do
        local package_name=$(get_package_name "$workspace")
        local package_folder=$(get_package_folder "$workspace")
        local package_path="$SHARED_ROOT/$package_folder"
        
        # Convert path for Windows npm if needed
        local npm_package_path=$(convert_path_for_npm "$package_path")
        
        if package_exists_in_external "$package_name" "$external_package_json"; then
            local current_version=$(get_current_version "$package_name" "$external_package_json")
            
            if is_linked "$current_version"; then
                ((already_linked++)) || true
                if [[ "$DEBUG" == true ]]; then
                    echo "  $package_name already linked (current: $current_version)"
                fi
                continue
            fi

            echo -n "  Linking $package_name... "
            
            # Capture both stdout and stderr for debugging
            local npm_output
            # Build npm install command based on target mode
            local npm_cmd="npm install \"file:$npm_package_path\" --save"
            if [[ -n "$WORKSPACE_FLAG" ]]; then
                npm_cmd="$npm_cmd $WORKSPACE_FLAG"
            fi
            if [[ "$DEP_SECTION" == "devDependencies" ]]; then
                npm_cmd="$npm_cmd --save-dev"
            fi
            npm_output=$(cd "$lock_path" && eval "$npm_cmd" 2>&1)
            local npm_exit_code=$?
            
            # Check if package was actually linked (npm on Windows may return error but still succeed)
            local new_version=$(get_current_version "$package_name" "$external_package_json")
            
            if is_linked "$new_version"; then
                printf "${GREEN}done${NC}\n"
            elif [[ $npm_exit_code -eq 0 ]]; then
                printf "${GREEN}done${NC}\n"
            else
                printf "${RED}failed${NC}\n"
                if [[ "$DEBUG" == true ]]; then
                    log_error "npm install failed with exit code $npm_exit_code"
                    echo "  Package path: $package_path"
                    echo "  NPM package path: $npm_package_path"
                    echo "  Lock path: $lock_path"
                    echo "  Command: $npm_cmd"
                    echo "  Output:"
                    echo "$npm_output" | sed 's/^/    /'
                    echo ""
                fi
            fi
        fi
    done
    set -e  # Re-enable exit on error
    
    if [[ $already_linked -gt 0 ]]; then
        echo "  ($already_linked package(s) already linked)"
    fi
    
    # Check if any packages failed and suggest debug mode
    local failed_count=0
    for workspace in "${WORKSPACE_PACKAGES[@]}"; do
        local package_name=$(get_package_name "$workspace")
        if package_exists_in_external "$package_name" "$external_package_json"; then
            local current_version=$(get_current_version "$package_name" "$external_package_json")
            if ! is_linked "$current_version"; then
                ((failed_count++)) || true
            fi
        fi
    done
    
    if [[ $failed_count -gt 0 && "$DEBUG" != true ]]; then
        echo ""
        log_warning "Some packages failed to link. Run with --debug flag for detailed error information:"
        echo "  $0 link --$TARGET_MODE --debug"
    fi

    # Show status
    show_status "$target_root"

    # Show next steps on success
    if [[ $failed_count -eq 0 ]]; then
        if [[ "$TARGET_MODE" == "perses" ]]; then
            printf "\nNow you can start the app dev server, in shared mode, from Perses:\n\ncd %s\nnpm run start:shared\n" "$package_json_path"
        else
            printf "\nPackages linked successfully to plugins.\n"
        fi
    fi
}

# =============================================================================
# Unlink Command
# =============================================================================

do_unlink() {
    local target_root="$1"
    local package_json_path="$target_root"
    if [[ "$PACKAGE_JSON_RELATIVE_PATH" != "." ]]; then
        package_json_path="$target_root/$PACKAGE_JSON_RELATIVE_PATH"
    fi
    local lock_path="$target_root"
    if [[ "$LOCK_RELATIVE_PATH" != "." ]]; then
        lock_path="$target_root/$LOCK_RELATIVE_PATH"
    fi
    local external_package_json="$package_json_path/package.json"
    local external_package_lock="$lock_path/package-lock.json"
    local backup_path="$package_json_path/$BACKUP_FILE"
    local backup_lock_path="$lock_path/$BACKUP_LOCK_FILE"
    
    if [[ ! -f "$external_package_json" ]]; then
        log_error "package.json not found at: $external_package_json"
        exit 1
    fi
    
    if [[ ! -f "$backup_path" ]]; then
        log_error "No backup file found. Cannot restore original versions."
        echo "  Manually restore: cd $package_json_path && npm install @perses-dev/components@<version> ..."
        exit 1
    fi
    
    # Check if backup file is empty or has no entries
    local backup_count=$(jq 'keys | length' "$backup_path" 2>/dev/null)
    if [[ -z "$backup_count" || "$backup_count" -eq 0 ]]; then
        log_error "Backup file is empty. Cannot restore original versions."
        echo "  Manually restore: cd $package_json_path && npm install @perses-dev/components@<version> ..."
        echo "  Or: rm $backup_path && cd $package_json_path && npm install"
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
            # Use the correct dependency section based on target mode
            local tmp=$(mktemp)
            if jq ".$DEP_SECTION[\"$package_name\"] = \"$original_version\"" "$external_package_json" > "$tmp" 2>/dev/null; then
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
            # Restore package-lock.json if backup exists and run npm install from lock root
            if [[ -f "$backup_lock_path" ]]; then
                echo "  Restoring package-lock.json..."
                cp "$backup_lock_path" "$external_package_lock"
                rm -f "$backup_lock_path"
            fi
            echo "  Running npm install from workspace root..."
            (cd "$lock_path" && npm install --silent 2>/dev/null)
        fi
    fi
    
    # Show warning for packages with missing backups
    if [[ ${#missing_backups[@]} -gt 0 ]]; then
        echo ""
        log_warning "Missing backup for: ${missing_backups[*]}"
        echo "  Manually restore: cd $package_json_path && npm install <package>@<version>"
    fi
    
    # Show status
    show_status "$target_root"
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    check_jq
    
    local command=""
    local target_root=""
    local target_specified=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            link|unlink|status)
                command="$1"
                shift
                ;;
            -d|--debug)
                DEBUG=true
                shift
                ;;
            -p|--perses)
                if [[ "$target_specified" == true ]]; then
                    log_error "Cannot specify both --perses and --plugins"
                    exit 1
                fi
                TARGET_MODE="perses"
                target_specified=true
                # Check if next argument is a path (not a flag or command)
                if [[ -n "$2" && ! "$2" =~ ^- && ! "$2" =~ ^(link|unlink|status)$ ]]; then
                    target_root="$2"
                    shift 2
                else
                    target_root="$DEFAULT_PERSES_ROOT"
                    shift
                fi
                ;;
            --plugins)
                if [[ "$target_specified" == true ]]; then
                    log_error "Cannot specify both --perses and --plugins"
                    exit 1
                fi
                TARGET_MODE="plugins"
                target_specified=true
                # Check if next argument is a path (not a flag or command)
                if [[ -n "$2" && ! "$2" =~ ^- && ! "$2" =~ ^(link|unlink|status)$ ]]; then
                    target_root="$2"
                    shift 2
                else
                    target_root="$DEFAULT_PLUGINS_ROOT"
                    shift
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
    
    # Default to perses if no target specified
    if [[ "$target_specified" == false ]]; then
        TARGET_MODE="perses"
        target_root="$DEFAULT_PERSES_ROOT"
    fi
    
    # Configure paths and settings based on target mode
    configure_target_mode
    
    # Resolve to absolute path
    if [[ ! "$target_root" = /* ]]; then
        target_root="$(cd "$SHARED_ROOT" && cd "$target_root" 2>/dev/null && pwd)" || {
            log_error "Cannot resolve path: $target_root"
            exit 1
        }
    fi
    
    # Check if target root exists
    if [[ ! -d "$target_root" ]]; then
        log_error "Target repository not found at: $target_root"
        exit 1
    fi
    
    # Check if package.json directory exists
    local package_json_path="$target_root/$PACKAGE_JSON_RELATIVE_PATH"
    if [[ ! -d "$package_json_path" ]]; then
        log_error "Target directory not found at: $package_json_path"
        log_error "Make sure the repository has the expected structure."
        exit 1
    fi
    
    # Execute command (default to 'link' if no command specified)
    case "$command" in
        link|"")
            do_link "$target_root"
            ;;
        unlink)
            do_unlink "$target_root"
            ;;
        status)
            show_status "$target_root"
            ;;
        *)
            log_error "Unknown command: $command"
            print_help
            exit 1
            ;;
    esac
}

main "$@"
