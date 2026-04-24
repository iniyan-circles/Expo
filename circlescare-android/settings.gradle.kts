import org.gradle.api.artifacts.repositories.PasswordCredentials
import org.gradle.authentication.http.BasicAuthentication
import java.util.Properties

pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
// local.properties is gitignored — safe place for credentials on dev machines
val localProps = Properties().apply {
    file("local.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        // Aligns Native libraries with exactly what's in your local node_modules
        maven { url = uri("$rootDir/../circlescare-expo/node_modules/react-native/android") }
        maven { url = uri("$rootDir/../circlescare-expo/node_modules/expo-modules-core/android") }
        
        // qa variant: picks up locally published brownfield AAR via `./gradlew publishToMavenLocal`
        mavenLocal()

        // Resolution order: local.properties → gradle.properties → env vars (GITHUB_ACTOR/GITHUB_TOKEN)
        // CI: GITHUB_ACTOR + GITHUB_TOKEN are injected automatically by GitHub Actions — no secrets needed
        val githubPackagesUser = localProps.getProperty("gpr.user")
            ?: providers.gradleProperty("gpr.user")
                .orElse(providers.environmentVariable("GITHUB_ACTOR"))
                .orNull
        val githubPackagesToken = localProps.getProperty("gpr.key")
            ?: providers.gradleProperty("gpr.key")
                .orElse(providers.environmentVariable("GITHUB_TOKEN"))
                .orNull

        if (!githubPackagesUser.isNullOrBlank() && !githubPackagesToken.isNullOrBlank()) {
            maven {
                name = "GitHubPackages"
                url = uri("https://maven.pkg.github.com/iniyanmurugavel/circles-roaming-brownfield")
                credentials(PasswordCredentials::class) {
                    username = githubPackagesUser
                    password = githubPackagesToken
                }
                authentication {
                    create<BasicAuthentication>("basic")
                }
            }
        }
        google()
        mavenCentral()
    }
}

rootProject.name = "circlescare-android"
include(":app")
