import org.gradle.api.artifacts.repositories.PasswordCredentials
import org.gradle.authentication.http.BasicAuthentication

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
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        // qa variant: picks up locally published brownfield AAR via `./gradlew publishToMavenLocal`
        mavenLocal()

        val githubPackagesUser =
            providers.gradleProperty("gpr.user")
                .orElse(providers.environmentVariable("GITHUB_ACTOR"))
                .orNull
        val githubPackagesToken =
            providers.gradleProperty("gpr.key")
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
