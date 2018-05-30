package com.fullapp.yashar.samck.services

import android.content.Context
import android.util.Log
import com.android.volley.Response
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.StringRequest
import com.android.volley.toolbox.Volley
import com.fullapp.yashar.samck.Utilitis.URL_CREATE
import com.fullapp.yashar.samck.Utilitis.URL_LOGIN
import com.fullapp.yashar.samck.Utilitis.URL_REGISTER
import org.json.JSONException
import org.json.JSONObject

object Authservice {
    var user= ""
    var authtoken= ""
    var islogedin =false;
fun registerUser(context: Context,email:String ,password: String,comlete:(Boolean)->Unit){

     val jsonBody =JSONObject()
    jsonBody.put("email",email)
    jsonBody.put("password",password)
    val requstBody =jsonBody.toString()
    val registerRequest = object :StringRequest(Method.POST, URL_REGISTER,Response.Listener {response ->
    // println(response)
        comlete(true)
    },Response.ErrorListener {error ->
        Log.d("ERROR" ,"could not register user: $error")
        comlete(false)


    }){
        override fun getBodyContentType(): String {
            return "application/json; charset=utf-8"
        }

        override fun getBody(): ByteArray {
            return requstBody.toByteArray()
        }
    }

    Volley.newRequestQueue(context).add(registerRequest)
}
    fun login_user(context:Context ,email: String,password: String ,comlete: (Boolean) -> Unit) {

        val jsonBody = JSONObject()
        jsonBody.put("email", email)
        jsonBody.put("password", password)
        val requstBody = jsonBody.toString()

        val login_Requst = object : JsonObjectRequest(Method.POST, URL_LOGIN, null, Response.Listener { response ->
            //    println(response)
            try {
                islogedin = true
                user = response.getString("user")
                authtoken = response.getString("token")
                comlete(true)
            } catch (e: JSONException) {
                Log.d("JSON", "EXP:" + e.localizedMessage)
                comlete(false)
            }

        }, Response.ErrorListener { error ->
            Log.d("ERROR", "could not login user: $error")
            comlete(false)

        }) {
            override fun getBodyContentType(): String {
                return "application/json; charset=utf-8"
            }

            override fun getBody(): ByteArray {
                return requstBody.toByteArray()
            }
        }

        Volley.newRequestQueue(context).add(login_Requst)


    }

        fun createUser(context: Context ,email:String,name:String,avatarName:String,avatarColor:String, complate:(Boolean)->Unit){


            val jsonBody =JSONObject()
            jsonBody.put("email",email)
            jsonBody.put("name",name)
            jsonBody.put("avatarName",avatarName)
            jsonBody.put("avatarColor",avatarColor)
            val requstBody =jsonBody.toString()
            val createRequest =object :JsonObjectRequest(Method.POST, URL_CREATE,null,Response.Listener { response ->
                try {
                    Userservise.name =response.getString("name")
                    Userservise.email=response.getString("email")
                    Userservise.avatarColor=response.getString("avatarColor")
                    Userservise.avatarName=response.getString("avatarName")
                    Userservise.id=response.getString("_id")
                    complate(true)

                }catch (e:JSONException){
                    Log.d("JSON","EXP:"+e.localizedMessage)
                    complate(false)
                }

            },Response.ErrorListener { error ->
                Log.d("ERROR" ,"could not create user: $error")
                complate(false)



            }){
                override fun getBodyContentType(): String {
                    return "application/json; charset=utf-8"
                }

                override fun getBody(): ByteArray {
                    return requstBody.toByteArray()

                }

                override fun getHeaders(): MutableMap<String, String> {
                    val headers = HashMap<String,String>()
                    headers.put("Authorization","Bearer $authtoken")
                    return headers
                }
            }
               Volley.newRequestQueue(context).add(createRequest)
        }

    }





