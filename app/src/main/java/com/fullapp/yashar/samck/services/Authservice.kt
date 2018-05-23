package com.fullapp.yashar.samck.services

import android.content.Context
import android.util.Log
import com.android.volley.Response
import com.android.volley.toolbox.StringRequest
import com.android.volley.toolbox.Volley
import com.fullapp.yashar.samck.Utilitis.URL_REGISTER
import org.json.JSONObject

object Authservice {
fun registerUser(context: Context,email:String ,paswoerd: String,comlete:(Boolean)->Unit){

     val jsonBody =JSONObject()
    jsonBody.put("email",email)
    jsonBody.put("password",paswoerd)
    val requstBody =jsonBody.toString()
    val registerRequest = object :StringRequest(Method.POST, URL_REGISTER,Response.Listener {response ->
     println(response)
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

}